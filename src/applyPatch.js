import * as PatchTypes from './patchTypes';

const ID_KEY = 'data-treact-id';

/**
 * Just convenient helper which re-maps
 * name of the React attribute to DOM attribute
 * eg. className -> class
 *
 * @param {string} Reactish attribute name
 * @return {string} DOM attribute name
 */
const mapAttributeToDomAttribute = attribute => {
  switch (attribute) {
    case 'className':
      return 'class';
    default:
      return attribute;
  }
};

/**
 * Creates DOM node specified by vDOM Node, the function is called
 * recursively so that entire subtree is created.
 *
 * @param {Object} vDOM node to be created
 * @param {Element} DOM Element used as mounting point for new node
 */
const createNodeRecursive = (vdomNode, domNode) => {
  // Obviously we need to treat TextNode specially
  if (vdomNode.type === 'text') {
    const textNode = document.createTextNode(vdomNode.attributes.text);
    domNode.appendChild(textNode);
  } else {
    const domElement = document.createElement(vdomNode.type);
    // Every created DOM element is tagged by ID so that
    // it's easy to correlate between DOM and vDOM
    domElement.setAttribute(ID_KEY, vdomNode.id);
    domNode.appendChild(domElement);

    // Here comes the recursion, which
    // obviously doesn't make sense for text nodes
    vdomNode.children.forEach(child => createNodeRecursive(child, domElement));
  }
};

/**
 * Finds DOM node which is correlated with provided
 * vDOM node
 *
 * @param {Object} vDOM node
 * @param {Element} DOM root node
 * @return {Element} Corresponding DOM node
 */
const getPatchDomNode = (vdomNode, domRoot) => {
  if (vdomNode === null) {
    return domRoot;
  } else {
    // Every DOM node contains data attribute
    // which is here used for corelation between
    // vDOM and DOM
    return document.querySelector(`[${ID_KEY}="${vdomNode.id}"]`);
  }
};

/**
 * The main function which takes vDOM patch and applies it to
 * real DOM. This is the only DOM specific part of the code.
 * It would possibly be part of `react-dom` package.
 *
 * @param {Object} Patch to be applied on DOM
 * @param {Element} Root DOM Element
 */
export default (patch, domRoot) => {
  switch (patch.type) {
    case PatchTypes.PATCH_CREATE_NODE: {
      // Creating DOM Node is recursive operation
      const domNode = getPatchDomNode(patch.parent, domRoot);
      createNodeRecursive(patch.node, domNode);
    }
      break;

    case PatchTypes.PATCH_REMOVE_NODE: {
      const domNode = getPatchDomNode(patch.node, domRoot);
      domNode.parentNode.removeChild(domNode);
    }
      break;

    case PatchTypes.PATCH_REPLACE_NODE: {
      // Replacing is basically remove & create recusively
      const domNode = getPatchDomNode(patch.replacingNode, domRoot);
      const parentDomNode = domNode.parentNode;
      parentDomNode.removeChild(domNode);
      createNodeRecursive(patch.node, parentDomNode);
    }
      break;

    case PatchTypes.PATCH_REPLACE_ATTRIBUTES: {
      if (patch.replacingNode.type === 'text') {
        const domNode = getPatchDomNode(patch.parent, domRoot);
        const textChildNode = ([...domNode.childNodes])
          .find(child => child.nodeValue === patch.replacingNode.attributes.text);
        textChildNode.nodeValue = patch.node.attributes.text;
      } else {
        const domNode = getPatchDomNode(patch.replacingNode, domRoot);

        // Let's create list of Pair<Key,Value> re-mapped DOM attributes
        const attributes = Object.keys(patch.node.attributes).map(attribute => ({
          key: mapAttributeToDomAttribute(attribute),
          value: patch.node.attributes[attribute]
        }));

        // Just set all the attributes
        attributes.forEach(({ key, value }) => domNode.setAttribute(key, value));
      }
    }
      break;

    default:
      throw new Error(`Missing implementation for patch ${patch.type}`);
  }
};
