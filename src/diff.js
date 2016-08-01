import * as PatchTypes from './patchTypes';
import shallowEqual from './shallowEqual';

/**
 * Creates a patch list by diffing two VDOM trees. It goes
 * recursively over the entire tree and trying to find VDOM differences. The
 * idea is perfectly described in the http://calendar.perfplanet.com/2013/diff/
 * article written by @vjeux
 *
 * @param {object} Node of the left VDOM tree
 * @param {object} Node of the right VDOM tree,
 * @param {array} Output list of patches, for performance reason, this is mutable
 * @param {object} Parent node of the left VDOM tree
 */
const diff = (
  left,
  right,
  patches = [],
  parentLeft = null
) => {
  if (!left) {
    // Skip the recursion when node is created
    patches.push({
      parent: parentLeft,
      type: PatchTypes.PATCH_CREATE_NODE,
      node: right
    });
  } else if (!right) {
    // Skip the recursion when node is removed
    patches.push({
      type: PatchTypes.PATCH_REMOVE_NODE,
      node: left
    });
  } else if (left.type !== right.type) {
    // Currently, when type of the Node is changed
    // the recursion is stopped and all the child
    // nodes are re-created.
    //
    // Another approach would be switching the node
    // type and copying the DOM children over.
    // In that case, the recursion should continue.
    patches.push({
      type: PatchTypes.PATCH_REPLACE_NODE,
      replacingNode: left,
      node: right
    });
  } else if (right.memoized) {
    // Here's the important optimization part
    // if the VDOM node is memoized, it doesn't make sense
    // to go through all the children and find any changes
    // we can skip the entire subtree as well as the current node
    return;
  } else {
    // When any attribute of the DOM node changes, we want to reflect
    // the fact, however this implementation is not ideal
    // because it should probably try to diff all the attributes
    // one by one, instead of replacing all of them at once.
    if (!shallowEqual(left.attributes, right.attributes)) {
      patches.push({
        type: PatchTypes.PATCH_REPLACE_ATTRIBUTES,
        parent: parentLeft,
        replacingNode: left,
        node: right
      });
    }

    const children = left.children.length >= right.children.length ?
      left.children :
      right.children;

    // Now is the right time for diffing the subtree,
    // remember this may have been skipped
    // when node was memoized
    children.forEach((child, index) => diff(
      left.children[index],
      right.children[index],
      patches,
      left
    ));
  }
};

export default diff;
