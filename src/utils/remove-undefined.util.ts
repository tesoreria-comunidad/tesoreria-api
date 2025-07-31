export function removeUndefined<T extends object>(obj: T): Partial<T> {
  Object.keys(obj).forEach(     // helper para eliminar campos undefined
    (key) => obj[key] === undefined && delete obj[key]
  );
  return obj;
}