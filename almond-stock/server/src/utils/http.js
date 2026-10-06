export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const r1 = (n) => Math.round(n * 10) / 10;
export const r3 = (n) => Math.round(n * 1000) / 1000;
