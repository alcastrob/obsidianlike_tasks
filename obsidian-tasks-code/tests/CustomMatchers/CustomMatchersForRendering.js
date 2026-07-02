"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toHaveAmongDataAttributes = toHaveAmongDataAttributes;
exports.toHaveDataAttributes = toHaveDataAttributes;
exports.toHaveAChildSpanWithClass = toHaveAChildSpanWithClass;
exports.toHaveAChildSpanWithClassAndDataAttributes = toHaveAChildSpanWithClassAndDataAttributes;
const jest_diff_1 = require("jest-diff");
function getTextSpan(listItem) {
    return listItem.children[1];
}
function getDataAttributesAsString(element) {
    const dataAttributes = element.dataset;
    const keys = Object.keys(dataAttributes);
    return keys.map((key) => `${key}: ${dataAttributes[key]}`).join('\n');
}
function toHaveAmongDataAttributes(htmlElement, expectedDataAttributes) {
    const renderedDataAttributes = getDataAttributesAsString(htmlElement);
    const pass = renderedDataAttributes.includes(expectedDataAttributes);
    const message = () => pass
        ? `Data attributes should not include '${expectedDataAttributes}'.\nRendered data attributes:\n${renderedDataAttributes}`
        : `Data attributes should include '${expectedDataAttributes}'.\nRendered data attributes:\n${renderedDataAttributes}`;
    return {
        message,
        pass,
    };
}
function toHaveDataAttributes(htmlElement, expectedDataAttributes) {
    const renderedDataAttributes = getDataAttributesAsString(htmlElement);
    const pass = renderedDataAttributes === expectedDataAttributes;
    const message = () => pass
        ? `Data attributes should not be\n${renderedDataAttributes}`
        : `Data attributes are not the same as expected:\n${(0, jest_diff_1.diff)(expectedDataAttributes, renderedDataAttributes)}`;
    return {
        message,
        pass,
    };
}
function toHaveAChildSpanWithClass(listItem, expectedClass) {
    const textSpan = getTextSpan(listItem);
    const childSpans = Array.from(textSpan.children);
    const pass = childSpans.some((childSpan) => {
        return childSpan.className === expectedClass;
    });
    const foundChildSpans = childSpans.map((childSpan) => childSpan.className).join('\n');
    const message = () => pass
        ? `Span with class ${expectedClass} found.`
        : `Span with class ${expectedClass} not found. Found spans with classes:\n${foundChildSpans}`;
    return {
        message,
        pass,
    };
}
function toHaveAChildSpanWithClassAndDataAttributes(listItem, expectedClass, expectedDataAttributes) {
    const textSpan = getTextSpan(listItem);
    const childSpans = Array.from(textSpan.children);
    for (const childSpan of childSpans) {
        if (childSpan.className === expectedClass) {
            const renderedDataAttributes = getDataAttributesAsString(childSpan);
            const pass = renderedDataAttributes === expectedDataAttributes;
            const message = () => pass
                ? `Data attributes for the span with '${expectedClass}' class should not be\n${renderedDataAttributes}`
                : `Data attributes for the span with '${expectedClass}' class are not the same as expected:\n${(0, jest_diff_1.diff)(expectedDataAttributes, renderedDataAttributes)}`;
            return {
                message,
                pass,
            };
        }
    }
    const foundChildSpans = childSpans.map((childSpan) => childSpan.className).join('\n');
    return {
        message: () => `The rendered list item does not contain a span with class '${expectedClass}'. Found spans with classes:\n${foundChildSpans}`,
        pass: false,
    };
}
//# sourceMappingURL=CustomMatchersForRendering.js.map