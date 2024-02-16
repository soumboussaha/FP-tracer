export declare const NODE_TYPE_ROOT: unique symbol;
export declare const NODE_TYPE_CHILD: unique symbol;
export declare type TrieRootNode = {
    type: typeof NODE_TYPE_ROOT;
    children: Map<string, TrieChildNode>;
};
export declare type TrieChildNode = {
    type: typeof NODE_TYPE_CHILD;
    label: string;
    children: Map<string, TrieChildNode>;
    parent: TrieNode;
};
export declare type TrieNode = TrieRootNode | TrieChildNode;
export declare const createRootNode: () => TrieRootNode;
export declare const createOrGetChild: (parent: TrieNode, label: string) => TrieChildNode;
