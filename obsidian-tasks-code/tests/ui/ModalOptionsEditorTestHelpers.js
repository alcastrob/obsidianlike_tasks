"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAndCheckButton = getAndCheckButton;
exports.checkAndClickApplyButton = checkAndClickApplyButton;
exports.checkAndClickCancelButton = checkAndClickCancelButton;
exports.renderAndCheckModal = renderAndCheckModal;
exports.verifyModalHTML = verifyModalHTML;
const svelte_1 = require("@testing-library/svelte");
const ModalOptionsEditor_svelte_1 = __importDefault(require("../../src/ui/ModalOptionsEditor.svelte"));
const ApprovalTestHelpers_1 = require("../TestingTools/ApprovalTestHelpers");
const HTMLHelpers_1 = require("../TestingTools/HTMLHelpers");
function getAndCheckButton(result, buttonId) {
    const submit = result.getByText(buttonId);
    expect(submit).toBeTruthy();
    return submit;
}
function checkAndClickApplyButton(result) {
    const apply = getAndCheckButton(result, 'Apply');
    apply.click();
}
function checkAndClickCancelButton(result) {
    const cancel = getAndCheckButton(result, 'Cancel');
    cancel.click();
}
function renderAndCheckModal(onSave = () => { }) {
    const result = (0, svelte_1.render)(ModalOptionsEditor_svelte_1.default, {
        onSave,
        onClose: () => { },
    });
    const { container } = result;
    expect(() => container).toBeTruthy();
    return { result, container };
}
function verifyModalHTML() {
    const { container } = renderAndCheckModal();
    const prettyHTML = (0, HTMLHelpers_1.prettifyHTML)(container.innerHTML);
    (0, ApprovalTestHelpers_1.verifyWithFileExtension)(prettyHTML, 'html');
}
//# sourceMappingURL=ModalOptionsEditorTestHelpers.js.map