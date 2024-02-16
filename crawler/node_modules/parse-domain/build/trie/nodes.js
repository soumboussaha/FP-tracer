export const NODE_TYPE_ROOT = Symbol("ROOT");
export const NODE_TYPE_CHILD = Symbol("CHILD");
export const createRootNode = () => {
    return {
        type: NODE_TYPE_ROOT,
        children: new Map(),
    };
};
export const createOrGetChild = (parent, label) => {
    let child = parent.children.get(label);
    if (child === undefined) {
        child = {
            type: NODE_TYPE_CHILD,
            label,
            children: new Map(),
            parent,
        };
        parent.children.set(label, child);
    }
    return child;
};
//# sourceMappingURL=nodes.js.map