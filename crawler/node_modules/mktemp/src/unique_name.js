/**
 * @file generate unique name
 */

const placeholder = /(X+)[^X]*$/;
const table = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const tableLength = table.length;

/**
 * count the number of possible outcomes for the template
 *
 * @param {string} template template string
 * @throws {TypeError} if template is not a string
 * @return {number} count of possible outcomes
 */
function getOutcomeCount(template) {
  if (typeof template !== 'string') {
    throw new TypeError(`template must be a string: ${template}`);
  }

  const matches = template.match(placeholder);

  if (matches === null) {
    return 1;
  }

  return Math.pow(tableLength, matches[1].length);
}

/**
 * generate unique name
 *
 * @param {string} template template string
 * @throws {TypeError} if template is not a string
 * @return {string} unique name string
 */
function generate(template) {
  if (typeof template !== 'string') {
    throw new TypeError(`template must be a string: ${template}`);
  }

  const matches = template.match(placeholder);

  if (matches === null) {
    return template;
  }

  const result = [];

  for (let i = 0, len = matches[1].length; i < len; ++i) {
    result.push(table[Math.floor(Math.random() * tableLength)]);
  }

  const { index: matchesIndex } = matches;

  return (
    template.slice(0, matchesIndex) +
    result.join('') +
    template.slice(matchesIndex + result.length)
  );
}

module.exports = {
  getOutcomeCount,
  generate
};
