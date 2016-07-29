const PATCH_CREATE_NODE = 'create';
const PATCH_REMOVE_NODE = 'remove';
const PATCH_REPLACE_NODE = 'replace';

const ID_KEY = 'data-treact-id';

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
const createVDOM = (element, id = '.') => {
  // Let's call this function recursively over all the
  // Children
  const newElement = {
    ...element,
    id,
    children: element.children.map((child, index) => createVDOM(child, `${id}${index}.`))
  };

  // Is this Element Component?
  if (typeof element.type === 'function') {
    // Execute the function and provide appropriate
    // properties as the function argument
    return createVDOM(newElement.type(element.props), id);
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
    // Skip the recursion when node is created
    return [...patches, {
      parent: parentLeft,
      type: PATCH_CREATE_NODE,
      node: right
    }];
  } else if (!right) {
    // Skip the recursion when node is removed
    return [...patches, {
      type: PATCH_REMOVE_NODE,
      node: left
    }];
  } else if (left.type !== right.type) {
    // Currently, when type of the Node is changed
    // the recursion is stopped and all the child
    // nodes are re-created.
    //
    // Another approach would be switching the node
    // type and copying the DOM children over.
    // In that case, the recursion should continue.
    return [...patches, {
      type: PATCH_REPLACE_NODE,
      replacingNode: left,
      node: right
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

const createNodeRecursive = (vdomNode, domNode) => {
  if (vdomNode.type === 'text') {
    const textNode = document.createTextNode(vdomNode.props.text);
    domNode.appendChild(textNode);

    vdomNode.children.forEach(child => createNodeRecursive(child, textNode));
  } else {
    const domElement = document.createElement(vdomNode.type);
    domElement.setAttribute(ID_KEY, vdomNode.id);
    domNode.appendChild(domElement);

    vdomNode.children.forEach(child => createNodeRecursive(child, domElement));
  }
};

const getPatchDomNode = (vdomNode, domRoot) => {
  if (vdomNode === null) {
    return domRoot;
  } else {
    return document.querySelector(`[${ID_KEY}="${vdomNode.id}"]`);
  }
};

const applyPatch = (patch, domRoot) => {
  switch (patch.type) {
    case PATCH_CREATE_NODE: {
      const domNode = getPatchDomNode(patch.parent, domRoot);
      createNodeRecursive(patch.node, domNode);
    }
      break;

    case PATCH_REMOVE_NODE: {
      const domNode = getPatchDomNode(patch.node, domRoot);
      domNode.parentNode.removeChild(domNode);
    }
      break;

    case PATCH_REPLACE_NODE: {
      const domNode = getPatchDomNode(patch.replacingNode, domRoot);
      const parentDomNode = domNode.parentNode;
      parentDomNode.removeChild(domNode);
      createNodeRecursive(patch.node, parentDomNode);
    }
      break;

    default:
      throw new Error(`Missing implementation for patch ${patch.type}`);
  }
};

export const createRender = domElement => {
  let lastVDOM = null;

  return element => {
    // Let's create a VDOM tree representation
    const vdom = createVDOM(element);

    // Apply every patch gotten from diff
    const patches = diff(lastVDOM, vdom);
    patches.forEach(patch => applyPatch(patch, domElement, null));

    lastVDOM = vdom;
  };
};
