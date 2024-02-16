import { createRootNode, createOrGetChild } from "./nodes.js";
export const createTrieFromList = (list) => {
    const root = createRootNode();
    for (const rule of list) {
        let node = root;
        for (const label of rule.split(".").reverse()) {
            node = createOrGetChild(node, label);
        }
    }
    return root;
};
//# sourceMappingURL=create-trie.js.map