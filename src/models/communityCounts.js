const recalculateCommunityCounts = (items) => {
  const counts = new Map();

  items.forEach((item) => {
    const key = `${item.parentType}:${item.parentId}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return counts;
};

export { recalculateCommunityCounts };
