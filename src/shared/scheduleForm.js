export function resolveGroupId(groups, selectedGroupId, groupQuery = "") {
  if (selectedGroupId) return selectedGroupId;

  const q = groupQuery.trim().toLowerCase();
  if (!q) return "";

  const exact = groups.find((group) => group.name.toLowerCase() === q);
  if (exact) return exact.id;

  const matches = groups.filter((group) => group.name.toLowerCase().includes(q));
  return matches.length === 1 ? matches[0].id : "";
}
