"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.i18n = exports.initializeI18n = void 0;
const i18next_1 = __importDefault(require("i18next"));
const obsidian_1 = require("obsidian");
// alphabetical order:
const be_json_1 = __importDefault(require("./locales/be.json"));
const de_json_1 = __importDefault(require("./locales/de.json"));
const en_json_1 = __importDefault(require("./locales/en.json"));
const ko_json_1 = __importDefault(require("./locales/ko.json"));
const pt_br_json_1 = __importDefault(require("./locales/pt_br.json"));
const ru_json_1 = __importDefault(require("./locales/ru.json"));
const tr_json_1 = __importDefault(require("./locales/tr.json"));
const uk_json_1 = __importDefault(require("./locales/uk.json"));
const vi_json_1 = __importDefault(require("./locales/vi.json"));
const zh_cn_json_1 = __importDefault(require("./locales/zh_cn.json"));
let isInitialized = false;
// Get Obsidian language settings
const getObsidianLanguage = () => {
    const storedLanguage = (0, obsidian_1.getLanguage)();
    return storedLanguage || 'en';
};
// Define a function to initialize i18next
const initializeI18n = async () => {
    if (!isInitialized) {
        await i18next_1.default.init({
            lng: getObsidianLanguage(),
            fallbackLng: 'en', // Fallback language if detection fails or translation is missing
            returnEmptyString: false, // Use fallback language if i18next-parser put in empty value for untranslated text
            resources: {
                // alphabetical order:
                // key:         the Obsidian "Language code", defined in
                //              https://github.com/obsidianmd/obsidian-translations?tab=readme-ov-file#existing-languages
                // translation: the filename of the JSON file in locales subdirectory
                be: { translation: be_json_1.default }, // Belarusian
                de: { translation: de_json_1.default }, // German
                en: { translation: en_json_1.default }, // English
                ko: { translation: ko_json_1.default }, // Korean
                'pt-BR': { translation: pt_br_json_1.default }, // Portuguese (Brazil)
                ru: { translation: ru_json_1.default }, // Russian
                tr: { translation: tr_json_1.default }, // Turkish
                uk: { translation: uk_json_1.default }, // Ukrainian
                vi: { translation: vi_json_1.default }, // Vietnamese
                zh: { translation: zh_cn_json_1.default }, // Chinese (Simplified)
            },
            interpolation: {
                escapeValue: false, // Disable escaping of strings, like '&' -> '&amp;'
            },
        });
        isInitialized = true;
    }
};
exports.initializeI18n = initializeI18n;
exports.i18n = new Proxy(i18next_1.default, {
    get(target, prop) {
        if (!isInitialized && prop === 't') {
            /* If you get the following error in tests, add this code block before the first
               test in the file.
               (Or add the 'await' line to the existing first beforeAll).

                    beforeAll(async () => {
                        await initializeI18n();
                    });
             */
            throw new Error('i18n.t() called before initialization. Call initializeI18n() first.');
        }
        return Reflect.get(target, prop);
    },
});
//# sourceMappingURL=i18n.js.map