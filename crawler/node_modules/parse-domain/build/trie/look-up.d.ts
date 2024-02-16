import { TrieNode } from "./nodes.js";
import { Label } from "../parse-domain.js";
export declare const lookUpTldsInTrie: (labels: Array<Label>, trie: TrieNode) => string[];
