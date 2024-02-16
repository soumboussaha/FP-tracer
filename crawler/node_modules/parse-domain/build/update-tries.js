var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { fetchPsl } from "./psl/fetch-psl.js";
import { buildTries } from "./psl/build-tries.js";
import { serializeTrie } from "./trie/serialize-trie.js";
export const fetchBuildSerializeTries = () => __awaiter(void 0, void 0, void 0, function* () {
    const psl = yield fetchPsl();
    const { icannTrie, privateTrie } = buildTries(psl);
    const serializedIcannTrie = serializeTrie(icannTrie);
    const serializedPrivateTrie = serializeTrie(privateTrie);
    return {
        serializedIcannTrie,
        serializedPrivateTrie,
    };
});
//# sourceMappingURL=update-tries.js.map