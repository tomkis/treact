import shallowEqual from './shallowEqual';

// Component registry holds all the memoized Component
// references, this is not ideal for production code
// because of the Singleton pattern.
const componentRegistry = new Map();

/**
 * Creates memoized Component
 * Memoized component remember last props & last result so
 * that it can return the last result without even calling
 * the function if input doesn't change
 *
 * @param {function} Component to be memoized
 * @param {function} Memoized Component
 */
const memoizeComponent = fn => {
  let prevProps = null;
  let memoizedResult = null;

  return (nextProps, skipPropCheck) => {
    // the component is called only when props changes
    if (skipPropCheck || !shallowEqual(prevProps, nextProps)) {
      memoizedResult = fn(nextProps);
      prevProps = nextProps;

      // A bit of mutable state to keep things fast
      // the flag is actually extremly useful for futher
      // optimization in diffing phase.
      //
      // When the VDOM node has this flag truthy
      // it's possible to skip diffing of the subtree. Because
      // obviously when props of the Component haven't changed
      // its result is still the same. We can utilize the fact
      // that Components are referentially transparent.
      memoizedResult.memoized = false;
    } else {
      memoizedResult.memoized = true;
    }

    return memoizedResult;
  };
};

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
export const h = (type, props = {}, children = []) => {
  if (typeof type === 'function') {
    const component = type;

    // It's important to store the memoized version in the Map
    // so that next time this function is called the Component retrieved
    // from ComponentRegistry instead of re-creating memoized
    // Component.
    if (!componentRegistry.has(component)) {
      componentRegistry.set(component, memoizeComponent(component));
    }

    const memoizedComponent = componentRegistry.get(component);

    return {
      type: memoizedComponent,
      props,
      children
    };
  } else {
    return {
      type,
      attributes: props,
      children
    };
  }
};

/**
 * Recursively creates VDOM representation from
 * root Element. It goes through the Element tree
 * and executes all the Components (type is function)
 * while passing provided props as Component argument.
 *
 * @param {object} HyperScriptish Element
 * @return {object} VDOM tree
 */
export const createVDOM = (element, id = '.', stateRepository) => {
  // Let's call this function recursively over all the
  // Children
  const newElement = {
    ...element,
    id,
    children:
      element.children.map((child, index) => createVDOM(child, `${id}${index}.`, stateRepository))
  };

  // Is this Element Component?
  if (typeof element.type === 'function') {
    // Set the pointer for current context
    stateRepository.componentId = id;

    // Execute the function (Component) and provide appropriate
    // properties as the function argument
    const subtree = { id, ...element.type(element.props, stateRepository.skipPropCheck) };

    // Reset the context pointer
    stateRepository.componentId = null;

    // Another nice performance optimization
    // No need to call the function down the tree
    // if subtree is memoized
    if (subtree.memoized) {
      return subtree;
    } else {
      return createVDOM(subtree, id, stateRepository);
    }
  } else {
    // Plain DOM node can be returned untouched
    return newElement;
  }
};
