const buildDiscoverMediaLookup = (rows = []) => rows.reduce((acc, row) => {
  const petId = row?.adoptable_pet_id;
  if (!petId) return acc;
  if (!acc[petId]) acc[petId] = [];
  acc[petId].push(row);
  return acc;
}, {});

export { buildDiscoverMediaLookup };
