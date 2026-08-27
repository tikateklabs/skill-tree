import { useState } from "react";
import type { CareerGraph, NonRoleNodeKind } from "../../domain/index.js";
import { useCareerGraph } from "../state/CareerGraphContext.js";

const NODE_KINDS: NonRoleNodeKind[] = ["capability", "skill", "concept", "technology", "tool"];

function allNodes(graph: CareerGraph) {
  return [graph.role, ...graph.nodes];
}

export function AddNodeForm({ graph }: { graph: CareerGraph }) {
  const { dispatch } = useCareerGraph();
  const [kind, setKind] = useState<NonRoleNodeKind>("capability");
  const [namespace, setNamespace] = useState("generic");
  const [name, setName] = useState("");
  const [parentIds, setParentIds] = useState<string[]>([]);
  const [requirementIds, setRequirementIds] = useState<string[]>([]);

  const nodes = allNodes(graph);
  const canSubmit = name.trim().length > 0 && parentIds.length > 0 && requirementIds.length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const provenance = requirementIds.map((requirementId) => {
      const requirement = graph.requirements.find((r) => r.id === requirementId)!;
      return { jobDescriptionId: requirement.jobDescriptionId, requirementId };
    });
    dispatch({
      type: "ADD_NODE",
      input: { kind, namespace, name: name.trim(), parentIds, provenance },
    });
    setName("");
    setParentIds([]);
    setRequirementIds([]);
  }

  return (
    <form onSubmit={handleSubmit} className="panel-form" aria-label="Add node">
      <h3>Add node</h3>
      <label>
        Kind
        <select value={kind} onChange={(e) => setKind(e.target.value as NonRoleNodeKind)}>
          {NODE_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </label>
      <label>
        Namespace
        <input value={namespace} onChange={(e) => setNamespace(e.target.value)} />
      </label>
      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        Parent(s)
        <select
          multiple
          value={parentIds}
          onChange={(e) => setParentIds(Array.from(e.target.selectedOptions, (o) => o.value))}
        >
          {nodes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name} ({n.kind})
            </option>
          ))}
        </select>
      </label>
      <label>
        Provenance (Requirement(s))
        <select
          multiple
          value={requirementIds}
          onChange={(e) => setRequirementIds(Array.from(e.target.selectedOptions, (o) => o.value))}
        >
          {graph.requirements.map((r) => (
            <option key={r.id} value={r.id}>
              {r.sourceText}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={!canSubmit}>
        Add node
      </button>
    </form>
  );
}
