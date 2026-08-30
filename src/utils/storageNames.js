const normalizeStorageFileName = (fileName) => {
  const fallbackName = `memory-${Date.now()}.jpg`;
  const rawName = String(fileName || fallbackName).trim() || fallbackName;
  return rawName.replace(/[^\w.\-]+/g, '_');
};

export {
  normalizeStorageFileName,
};
