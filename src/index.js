import { h, createVDOM } from './vdom';
import diff from './diff';
import applyPatch from './applyPatch';

export { h as h };

export const createRender = domElement => {
  // Obviously lastVDOM root node is `null`
  // in first call, that's why we are doing
  // null - vDOM which results in creating of
  // Root DOMNode
  let lastVDOM = null;
  let patches = null;

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
    patches.forEach(patch => applyPatch(patch, domElement, null));

    lastVDOM = vdom;
  };
};
