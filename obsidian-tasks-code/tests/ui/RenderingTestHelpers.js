"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAndCheckRenderedElement = getAndCheckRenderedElement;
exports.getAndCheckRenderedDescriptionElement = getAndCheckRenderedDescriptionElement;
exports.getAndCheckApplyButton = getAndCheckApplyButton;
exports.editInputElement = editInputElement;
exports.uncheckCheckbox = uncheckCheckbox;
exports.optionsWithoutARandomField = optionsWithoutARandomField;
const svelte_1 = require("@testing-library/svelte");
const Settings_1 = require("../../src/Config/Settings");
/**
 * Find the element with the given id.
 * Template type T might be, for example, HTMLInputElement or HTMLSelectElement
 * @param container
 * @param elementId
 */
function getAndCheckRenderedElement(container, elementId) {
    const element = container.ownerDocument.getElementById(elementId);
    expect(element).not.toBeNull();
    return element;
}
function getAndCheckRenderedDescriptionElement(container) {
    return getAndCheckRenderedElement(container, 'description');
}
function getAndCheckApplyButton(result) {
    const submit = result.getByText('Apply');
    expect(submit).toBeTruthy();
    return submit;
}
async function editInputElement(inputElement, newValue) {
    await svelte_1.fireEvent.input(inputElement, { target: { value: newValue } });
}
async function uncheckCheckbox(container, elementId) {
    const inputElement = getAndCheckRenderedElement(container, elementId);
    await svelte_1.fireEvent.change(inputElement, { target: { checked: false } });
}
function randomIndex(max) {
    return Math.floor(Math.random() * max);
}
function optionsWithoutARandomField() {
    const fields = Object.keys((0, Settings_1.getSettings)().isShownInEditModal);
    const randomField = fields[randomIndex(fields.length - 1)];
    const optionsWithoutARandomField = { ...(0, Settings_1.getSettings)().isShownInEditModal };
    delete optionsWithoutARandomField[randomField];
    return optionsWithoutARandomField;
}
//# sourceMappingURL=RenderingTestHelpers.js.map