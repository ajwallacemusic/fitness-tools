/** Inputs valid but semantically impossible, or a required method's inputs are missing. */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
