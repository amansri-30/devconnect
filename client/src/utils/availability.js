// Keep this list in sync with the Profile model enum and the backend's
// AVAILABILITY_OPTIONS in routes/api/profile.js.
export const AVAILABILITY_OPTIONS = [
  { value: 'open-to-work', label: 'Open to work' },
  { value: 'hiring', label: 'Hiring' },
  { value: 'open-to-mentoring', label: 'Open to mentoring' }
];

const LABELS = AVAILABILITY_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

// Return the human-readable label for a stored availability value, or '' when
// the developer hasn't set one.
export const availabilityLabel = (value) => LABELS[value] || '';

// A small icon per option so badges are recognisable at a glance.
export const availabilityIcon = (value) => {
  if (value === 'hiring') return 'fas fa-user-plus';
  if (value === 'open-to-mentoring') return 'fas fa-hands-helping';
  return 'fas fa-briefcase';
};
