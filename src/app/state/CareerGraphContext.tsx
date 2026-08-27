import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { type AppAction, type AppState, initialState, reducer } from "./reducer.js";
import { loadPersistedGraph, savePersistedGraph } from "./persistence.js";

interface CareerGraphContextValue {
  state: AppState;
  dispatch: (action: AppAction) => void;
}

const CareerGraphContext = createContext<CareerGraphContextValue | null>(null);

export function CareerGraphProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hasLoaded, setHasLoaded] = useState(false);
  // Mirrors state.graph synchronously (updated during render, not via an
  // effect) so the async load callback below can check the *current*
  // value rather than the one captured in its closure at mount time.
  const graphRef = useRef(state.graph);
  graphRef.current = state.graph;

  useEffect(() => {
    let cancelled = false;
    loadPersistedGraph().then((graph) => {
      if (cancelled) return;
      // If the user already created/imported a graph while this load
      // was in flight, applying the (now-stale) loaded value would
      // silently overwrite their work - most often back to `null`, since
      // nothing had been saved yet when the load started. Only apply it
      // if nothing has happened in the meantime.
      if (graphRef.current === null) {
        dispatch({ type: "LOAD", graph });
      }
      setHasLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Don't persist until the initial load has resolved - otherwise the
    // pre-load state could overwrite a real saved graph. `hasLoaded` is
    // real state (not a ref) specifically so this effect re-runs and
    // saves once loading completes even if a mutation happened *during*
    // the load and `state.graph` itself didn't change again afterward.
    if (!hasLoaded || !state.graph) return;

    // Every `state.graph` change is already one discrete, deliberate
    // mutation (a form submit dispatches one reducer action; nothing
    // dispatches per-keystroke), so there's no rapid-fire-events case to
    // debounce against - only a real risk of losing a save if the page
    // is closed/reloaded before a debounce timer fires. Save
    // immediately instead.
    void savePersistedGraph(state.graph);
  }, [state.graph, hasLoaded]);

  return (
    <CareerGraphContext.Provider value={{ state, dispatch }}>
      {children}
    </CareerGraphContext.Provider>
  );
}

export function useCareerGraph(): CareerGraphContextValue {
  const ctx = useContext(CareerGraphContext);
  if (!ctx) {
    throw new Error("useCareerGraph must be used within a CareerGraphProvider");
  }
  return ctx;
}
