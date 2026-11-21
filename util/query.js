// Express turns a repeated query key into an array (?search=a&search=b).
// String helpers such as .trim() then throw and surface as a 500. Keep only
// the first value and coerce anything unexpected to an empty string.
const stringParam = (value) => {
  if (Array.isArray(value)) return stringParam(value[0]);
  return typeof value === 'string' ? value : '';
};

module.exports = { stringParam };
