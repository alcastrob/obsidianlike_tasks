"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValueType = getValueType;
/**
 * Return a string representation of the {@link value}'s type, for showing to users, such as in error messages.
 * @param value
 */
function getValueType(value) {
    if (value === null) {
        return 'null';
    }
    const type = typeof value;
    if (type === 'object') {
        return value.constructor.name;
    }
    return type;
}
//# sourceMappingURL=TypeDetection.js.map