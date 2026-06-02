/** Inputs are valid types but semantically/physically impossible, or an
 * explicitly requested method's required inputs are missing. */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
