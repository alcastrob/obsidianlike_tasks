"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionsModal = void 0;
const obsidian_1 = require("obsidian");
const ModalOptionsEditor_svelte_1 = __importDefault(require("../ui/ModalOptionsEditor.svelte"));
/**
 * This is a modal that is shown within a {@link TaskModal} object to allow fields to be hidden.
 *
 * Implemented using {@link ModalOptionsEditor} Svelte component.
 */
class OptionsModal extends obsidian_1.Modal {
    constructor({ app, onSave }) {
        super(app);
        this.onSave = onSave;
    }
    onOpen() {
        this.titleEl.setText('Hide unused fields');
        this.modalEl.addClass('tasks-options-modal-container');
        const { contentEl } = this;
        new ModalOptionsEditor_svelte_1.default({
            target: contentEl,
            props: {
                onSave: () => {
                    this.onSave();
                    this.close();
                },
                onClose: () => {
                    this.onClose();
                    this.close();
                },
            },
        });
    }
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
exports.OptionsModal = OptionsModal;
//# sourceMappingURL=OptionsModal.js.map