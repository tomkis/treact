/**
 * Checks whether two objects are shallow equal
 *
 * @param {object} left object
 * @param {object} right object
 * @return {bool} equality check
 */
export default (left, right) => {
  if (!left || !right) {
    return false;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  return leftKeys.length === rightKeys.length &&
    leftKeys.every(leftKey => left[leftKey] === right[leftKey]);
};
