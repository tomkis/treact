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

export const createRender = domElement => {
  let lastVDOM = null;

  return element => {
    const vdom = createVDOM(element);
    console.log(vdom);

    lastVDOM = vdom;
  };
};
