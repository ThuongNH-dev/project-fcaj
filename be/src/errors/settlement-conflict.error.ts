export class SettlementConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SettlementConflictError";
  }
}
