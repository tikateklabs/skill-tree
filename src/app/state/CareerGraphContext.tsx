import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { type AppAction, type AppState, initialState, reducer } from "./reducer.js";
import { loadPersistedGraph, savePersistedGraph } from "./persistence.js";

const AUTOSAVE_DEBOUNCE_MS = 300;

interface CareerGraphContextValue {
  state: AppState;
  dispatch: (action: AppAction) => void;
}

const CareerGraphContext = createContext<CareerGraphContextValue | null>(null);

export function CareerGraphProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const hasLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadPersistedGraph().then((graph) => {
      if (cancelled) return;
      hasLoadedRef.current = true;
      dispatch({ type: "LOAD", graph });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Don't persist until the initial load has resolved - otherwise the
    // pre-load `null` state would overwrite a real saved graph.
    if (!hasLoadedRef.current || !state.graph) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    const graph = state.graph;
    saveTimeoutRef.current = setTimeout(() => {
      void savePersistedGraph(graph);
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [state.graph]);

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
