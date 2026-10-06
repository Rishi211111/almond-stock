// Shared toJSON transform: expose "id" instead of "_id", hide internals.
export function cleanTransform(doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  delete ret.passwordHash;
  return ret;
}
