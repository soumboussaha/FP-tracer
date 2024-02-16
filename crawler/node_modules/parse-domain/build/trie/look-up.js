import * as characters from "./characters.js";
export const lookUpTldsInTrie = (labels, trie) => {
    const labelsToCheck = labels.slice();
    const tlds = [];
    let node = trie;
    while (labelsToCheck.length !== 0) {
        const label = labelsToCheck.pop();
        const labelLowerCase = label.toLowerCase();
        if (node.children.has(characters.WILDCARD)) {
            if (node.children.has(characters.EXCEPTION + labelLowerCase)) {
                break;
            }
            node = node.children.get(characters.WILDCARD);
        }
        else {
            if (node.children.has(labelLowerCase) === false) {
                break;
            }
            node = node.children.get(labelLowerCase);
        }
        tlds.unshift(label);
    }
    return tlds;
};
//# sourceMappingURL=look-up.js.map