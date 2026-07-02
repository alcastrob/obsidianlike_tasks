"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const i18next_1 = __importDefault(require("i18next"));
function getAllLocaleJsonFileBaseNames() {
    const localesDir = path.resolve(__dirname, '../../src/i18n/locales');
    return fs
        .readdirSync(localesDir)
        .filter((file) => file.endsWith('.json'))
        .filter((file) => !file.endsWith('_old.json')) // skip any backup files created by 'yarn extract-i18n'
        .sort()
        .map((file) => file.replace('.json', ''));
}
function readI18nJsonImports() {
    // Find the names of JSON locale files imported by the plugin:
    const i18nSource = fs.readFileSync(path.resolve(__dirname, '../../src/i18n/i18n.ts'), 'utf-8');
    return [...i18nSource.matchAll(/^import\s+\w+\s+from\s+'.*\/(\w+)\.json'/gm)].map((m) => m[1]);
}
function getI18nextParserLocales() {
    // Find the locales used by 'yarn extract-i18n'
    const parserConfig = require('../../i18next-parser.config.js');
    return parserConfig.locales;
}
let i18nResourceNames;
beforeAll(async () => {
    // initializeI18n is called in jest.setup.ts
    i18nResourceNames = Object.freeze(Object.keys(i18next_1.default.store.data));
});
describe('i18n locale consistency', () => {
    const allJsonLocaleFileBaseNames = getAllLocaleJsonFileBaseNames();
    describe('"i18n.ts" imports', () => {
        const i18nImports = readI18nJsonImports();
        it('should list Json imports in alphabetical order', () => {
            expect(i18nImports).toBeSorted();
        });
        it('should should import all JSON files', () => {
            expect(i18nImports).toEqual(allJsonLocaleFileBaseNames);
        });
    });
    describe('"i18n.ts" resources', () => {
        it('should list resources imports in alphabetical order', () => {
            expect(i18nResourceNames).toBeSorted();
        });
        it('should reference all JSON files', () => {
            // The resource names may differ from the JSON file names:
            //     "pt_br" vs "pt-BR"
            //     "zh_cn" vs "zh"
            // So we just check the number of entries, rather than the string values:
            expect(i18nResourceNames.length).toEqual(allJsonLocaleFileBaseNames.length);
        });
    });
    describe('"i18next-parser.config.js"', () => {
        const parserLocales = getI18nextParserLocales();
        it('should list locales in alphabetical order', () => {
            expect(parserLocales).toBeSorted();
        });
        it('should reference all JSON files', () => {
            expect(parserLocales).toEqual(allJsonLocaleFileBaseNames);
        });
    });
});
//# sourceMappingURL=i18n.test.js.map