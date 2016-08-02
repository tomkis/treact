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

export const createRender = domElement => {
  // Obviously lastVDOM root node is `null`
  // in first call, that's why we are doing
  // null - vDOM which results in creating of
  // Root DOMNode
  let lastVDOM = null;
  let patches = null;

  const eventHandlerRepository = new Map();
  document.addEventListener('click', createEventListener('onClick', eventHandlerRepository));

  return element => {
    // Let's create a VDOM tree representation
    const vdom = createVDOM(element);

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
};
