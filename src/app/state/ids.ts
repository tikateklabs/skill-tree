/** Opaque id generator for entities whose id is not derived (JobDescription, Requirement, Role). */
export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
