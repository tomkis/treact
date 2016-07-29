const PATCH_CREATE_NODE = 'create';
const PATCH_REMOVE_NODE = 'remove';

const flatMap = (list, mapper) => [].concat.apply([], list.map(mapper));

/**
 * Creates HyperScriptish Element
 *
 * @param {string|function} Type of the Element,
 *        this may either be String (for DOM nodes) or Function for Components
 *
 * @param {object} Props of the Element/DOM Node
 * @param {array} List of child Elements
 *
 * @returns {object} Object abstraction of the Element
 */
export const h = (type, props = {}, children = []) => ({
  type,
  props,
  children
});

/**
 * Recursively creates VDOM representation from
 * root Element. It goes through the Element tree
 * and executes all the Components (type is function)
 * while passing provided props as Component argument.
 *
 * @param {object} HyperScriptish Element
 * @return {object} VDOM tree
 */
const createVDOM = element => {
  // Let's call this function recursively over all the
  // Children
  const newElement = {
    ...element,
    children: element.children.map(child => createVDOM(child))
  };

  // Is this Element Component?
  if (typeof element.type === 'function') {
    // Execute the function and provide appropriate
    // properties as the function argument
    return createVDOM(newElement.type(element.props));
  } else {
    // Plain DOM node can be returned untouched
    return newElement;
  }
};

/**
 * Creates a patch list by diffing two VDOM trees. It goes
 * recursively over the entire tree and trying to find VDOM differences. The
 * idea is perfectly described in the http://calendar.perfplanet.com/2013/diff/
 * article written by @vjeux
 */
const diff = (
  left,
  right,
  patches = [],
  parentLeft = null
) => {
  if (!left) {
    return [...patches, {
      parent: parentLeft,
      type: PATCH_CREATE_NODE,
      node: right
    }];
  } else if (!right) {
    return [...patches, {
      type: PATCH_REMOVE_NODE,
      node: left
    }];
  } else {
    const children = left.children.length >= right.children.length ?
      left.children :
      right.children;

    return flatMap(children, (child, index) => diff(
      left.children[index],
      right.children[index],
      patches,
      left
    ));
  }
};

export const createRender = domElement => {
  let lastVDOM = null;

  return element => {
    const vdom = createVDOM(element);
    const patches = diff(lastVDOM, vdom);
    console.log(patches);

    lastVDOM = vdom;
  };
};
