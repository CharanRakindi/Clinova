/**
 * Normalize a clinician display name to a single "Dr. First Last" form.
 * Handles seed data already prefixed with Dr./Doctor and nested prefixes.
 */
export function formatDoctorName(name) {
  if (name == null) return 'Doctor';

  // Support populated objects { name } or plain strings
  const raw = typeof name === 'string' ? name : name?.name;
  if (!raw || typeof raw !== 'string') return 'Doctor';

  let clean = raw.trim().replace(/\s+/g, ' ');
  if (!clean) return 'Doctor';

  // Strip repeated leading titles: "Dr.", "Dr", "Doctor", with or without space
  for (let i = 0; i < 5; i++) {
    const next = clean.replace(/^(dr\.?|doctor)\.?\s*/i, '').trim();
    if (next === clean) break;
    clean = next;
  }

  if (!clean) return 'Doctor';

  // Capitalize first letter of each word for consistency
  const pretty = clean
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');

  return `Dr. ${pretty}`;
}
