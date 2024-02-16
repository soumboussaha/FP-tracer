export const toASCII = (hostname) => {
    return new URL(`http://${hostname}`).hostname;
};
//# sourceMappingURL=punycode.js.map