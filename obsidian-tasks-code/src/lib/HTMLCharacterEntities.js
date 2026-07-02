"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.htmlEncodeCharacter = htmlEncodeCharacter;
exports.htmlEncodeString = htmlEncodeString;
/**
 * Convert any single reserved HTML character to its entity name.
 * @param character
 *
 * @see htmlEncodeString
 */
function htmlEncodeCharacter(character) {
    const charactersToEntityNames = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
    };
    const candidateEntityName = charactersToEntityNames[character];
    if (candidateEntityName !== undefined) {
        return candidateEntityName;
    }
    return character;
}
/**
 * Convert reserved HTML characters to their entity names.
 * @param characters
 *
 * @see htmlEncodeCharacter
 */
function htmlEncodeString(characters) {
    const chars = [...characters];
    let result = '';
    chars.forEach((c) => {
        result += htmlEncodeCharacter(c);
    });
    return result;
}
//# sourceMappingURL=HTMLCharacterEntities.js.map