import { PUBLIC_SUFFIX_MARKER_ICANN_START, PUBLIC_SUFFIX_MARKER_ICANN_END, PUBLIC_SUFFIX_MARKER_PRIVATE_START, PUBLIC_SUFFIX_MARKER_PRIVATE_END, } from "../config.js";
import { toASCII } from "../punycode.js";
import { createTrieFromList } from "../trie/create-trie.js";
const matchNewLine = /\r?\n/u;
const matchComment = /^\s*\/\//u;
const matchWhitespace = /^\s*$/u;
const extractByMarkers = (listContent, startMarker, endMarker) => {
    const start = listContent.indexOf(startMarker);
    const end = listContent.indexOf(endMarker);
    if (start === -1) {
        throw new Error(`Missing start marker ${startMarker} in public suffix list`);
    }
    if (end === -1) {
        throw new Error(`Missing end marker ${endMarker} in public suffix list`);
    }
    return listContent.slice(start, end);
};
const containsRule = (line) => matchComment.test(line) === false && matchWhitespace.test(line) === false;
const parsePsl = (listContent) => {
    return {
        icann: extractByMarkers(listContent, PUBLIC_SUFFIX_MARKER_ICANN_START, PUBLIC_SUFFIX_MARKER_ICANN_END)
            .split(matchNewLine)
            .filter(containsRule)
            .map(toASCII),
        private: extractByMarkers(listContent, PUBLIC_SUFFIX_MARKER_PRIVATE_START, PUBLIC_SUFFIX_MARKER_PRIVATE_END)
            .split(matchNewLine)
            .filter(containsRule)
            .map(toASCII),
    };
};
export const buildTries = (psl) => {
    const parsedPsl = parsePsl(psl);
    const icannTrie = createTrieFromList(parsedPsl.icann);
    const privateTrie = createTrieFromList(parsedPsl.private);
    return {
        icannTrie,
        privateTrie,
    };
};
//# sourceMappingURL=build-tries.js.map