import { h, createVDOM } from './vdom';
import diff from './diff';
import applyPatch from './applyPatch';

export { h as h };

export const ID_KEY = 'data-treact-id';

const createEventListener = (eventName, eventHandlerRepository) => ev => {
  let stopPropagation = false;

  // We need custom stopPropagation function
  // because we are catching the event on
  // document.body so we need to implement
  // bubbling & capturing manually
  //
  // Not ideal implementation, in real world you would have an adapter
  // The implementation is a bit different than in React because
  // they have global pool of events so that they can keep the original references
  // to all the events.
  ev.stopPropagation = () => { // eslint-disable-line no-param-reassign
    stopPropagation = true;
  };

  // Let's get an ID of correlated bottom most vDOM node
  const vDOMNodeId = ev.target.getAttribute(ID_KEY);

  if (vDOMNodeId) {
    // Now it's just a matter of string manipulation to
    // figure out capturePath and bubblePath
    const idPath = vDOMNodeId.split('.');

    const capturePath = idPath
      .map((chunk, index) =>
        `${idPath
        .filter((subChunk, subIndex) => subIndex <= index)
        .join('.')}.`
      )
      .filter((chunk, index) => index < idPath.length - 1);

    // bubblePath contains a ID list of all the vDOM nodes
    // where event should bubble
    // eg:
    // ['.0.1.', '.0.', '.']
    const bubblePath = capturePath.reverse();

    bubblePath.forEach(path => {
      // Resolve the appropriate event handlers registered by `applyPatch`
      // We may break the chain by stopPropagation variable
      if (eventHandlerRepository.has(path) && !stopPropagation) {
        const attachedEvents = eventHandlerRepository.get(path);
        const eventHandler = attachedEvents.find(({ key }) => key === eventName);

        // If there's an event registered in eventHandlerRepository
        // just execute it and provide original event reference
        if (eventHandler) {
          eventHandler.value(ev);
        }
      }
    });
  }
};

export const createTreact = domElement => {
  // Obviously lastVDOM root node is `null`
  // in first call, that's why we are doing
  // null - vDOM which results in creating of
  // Root DOMNode
  let lastVDOM = null;
  let patches = null;

  const eventHandlerRepository = new Map();

  // We have to keep the state repository in the top level.
  // In current React Fiber architecture this is easily implemented
  // because each fiber uses its own controlled fiber-scoped stack.
  //
  // State repo contains 3 things:
  //
  // skipPropCheck - tells treact to ignore equal checking for props so
  //    that whole tree gets traversed (eg. when state changes)
  //
  // componentId - ID of currently processed
  //    component instance (stack pointer in Fiber architecture)
  //
  // contexts - object holding all the state references - in this implementation
  //    we do not clean this up upon component unmounting (for clarity)
  const stateRepository = {
    skipPropCheck: true,
    componentId: null,
    contexts: {}
  };

  document.addEventListener('click', createEventListener('onClick', eventHandlerRepository));

  let lastRoot = null;
  const render = element => {
    lastRoot = element;

    // Let's create a VDOM tree representation
    const vdom = createVDOM(element, undefined, stateRepository);

    // let's reset the patches list
    // on every render, we want to have
    // patch list as mutable array because
    // of performance
    patches = [];

    // Here comes the magic, just create
    // list of patches based on lastVDOM
    // and current vDOM
    diff(lastVDOM, vdom, patches);

    // Apply every patch gotten from diff
    patches.forEach(patch => applyPatch(patch, domElement, eventHandlerRepository));

    lastVDOM = vdom;
  };

  const useState = initialState => {
    // Set the intial state if it's
    // still not present in the context object
    if (!stateRepository.contexts[stateRepository.componentId]) {
      stateRepository.contexts[stateRepository.componentId] = initialState;
    }

    // Find particular state slice
    const state = stateRepository.contexts[stateRepository.componentId];

    // The most important step
    // we need to copy over the current component id
    // to particular closure of the callback
    const currentComponentId = stateRepository.componentId;

    return [state, (value) => {
      // If state changes
      if (value !== stateRepository.contexts[currentComponentId]) {
        // Update the context
        stateRepository.contexts[currentComponentId] = value;

        // Mark skipPropCheck so that treact
        // traverse whole tree even when props won't change
        // Far from being ideal implementation - but
        // for demo purpose it's really easy and clear
        stateRepository.skipPropCheck = true;

        // Render from root
        render(lastRoot);

        // Reset the propcheck skipping
        stateRepository.skipPropCheck = false;
      }
    }];
  };

  return {
    render,
    useState
  };
};
