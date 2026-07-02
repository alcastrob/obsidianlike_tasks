"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomStatusModal = void 0;
const obsidian_1 = require("obsidian");
const StatusConfiguration_1 = require("../Statuses/StatusConfiguration");
const StatusValidator_1 = require("../Statuses/StatusValidator");
const Status_1 = require("../Statuses/Status");
const i18n_1 = require("../i18n/i18n");
const validator = new StatusValidator_1.StatusValidator();
class CustomStatusModal extends obsidian_1.Modal {
    constructor(plugin, statusType, isCoreStatus) {
        super(plugin.app);
        this.plugin = plugin;
        this.saved = false;
        this.error = false;
        this.statusSymbol = statusType.symbol;
        this.statusName = statusType.name;
        this.statusNextSymbol = statusType.nextStatusSymbol;
        this.statusAvailableAsCommand = statusType.availableAsCommand;
        this.type = statusType.type;
        this.isCoreStatus = isCoreStatus;
    }
    /**
     * Return a {@link StatusConfiguration} from the modal's contents
     */
    statusConfiguration() {
        return new StatusConfiguration_1.StatusConfiguration(this.statusSymbol, this.statusName, this.statusNextSymbol, this.statusAvailableAsCommand, this.type);
    }
    display() {
        const { contentEl } = this;
        contentEl.empty();
        const settingDiv = contentEl.createDiv();
        //const title = this.title ?? '...';
        let statusSymbolText;
        new obsidian_1.Setting(settingDiv)
            .setName(i18n_1.i18n.t('modals.customStatusModal.editStatusSymbol.name'))
            .setDesc(i18n_1.i18n.t('modals.customStatusModal.editStatusSymbol.description'))
            .addText((text) => {
            statusSymbolText = text;
            text.setValue(this.statusSymbol).onChange((v) => {
                this.statusSymbol = v;
                CustomStatusModal.setValid(text, validator.validateSymbol(this.statusConfiguration()));
            });
        })
            .setDisabled(this.isCoreStatus)
            .then((_setting) => {
            // Show any error if the initial value loaded is incorrect.
            CustomStatusModal.setValid(statusSymbolText, validator.validateSymbol(this.statusConfiguration()));
        });
        let statusNameText;
        new obsidian_1.Setting(settingDiv)
            .setName(i18n_1.i18n.t('modals.customStatusModal.editStatusName.name'))
            .setDesc(i18n_1.i18n.t('modals.customStatusModal.editStatusName.description'))
            .addText((text) => {
            statusNameText = text;
            text.setValue(this.statusName).onChange((v) => {
                this.statusName = v;
                CustomStatusModal.setValid(text, validator.validateName(this.statusConfiguration()));
            });
        })
            .then((_setting) => {
            CustomStatusModal.setValid(statusNameText, validator.validateName(this.statusConfiguration()));
        });
        let statusNextSymbolText;
        new obsidian_1.Setting(settingDiv)
            .setName(i18n_1.i18n.t('modals.customStatusModal.editNextStatusSymbol.name'))
            .setDesc(i18n_1.i18n.t('modals.customStatusModal.editNextStatusSymbol.description'))
            .addText((text) => {
            statusNextSymbolText = text;
            text.setValue(this.statusNextSymbol).onChange((v) => {
                this.statusNextSymbol = v;
                CustomStatusModal.setValid(text, validator.validateNextSymbol(this.statusConfiguration()));
            });
        })
            .then((_setting) => {
            CustomStatusModal.setValid(statusNextSymbolText, validator.validateNextSymbol(this.statusConfiguration()));
        });
        new obsidian_1.Setting(settingDiv)
            .setName(i18n_1.i18n.t('modals.customStatusModal.editStatusType.name'))
            .setDesc(i18n_1.i18n.t('modals.customStatusModal.editStatusType.description'))
            .addDropdown((dropdown) => {
            const types = [
                StatusConfiguration_1.StatusType.TODO,
                StatusConfiguration_1.StatusType.IN_PROGRESS,
                StatusConfiguration_1.StatusType.ON_HOLD,
                StatusConfiguration_1.StatusType.DONE,
                StatusConfiguration_1.StatusType.CANCELLED,
                StatusConfiguration_1.StatusType.NON_TASK,
            ];
            types.forEach((s) => {
                dropdown.addOption(s, s);
            });
            dropdown.setValue(this.type).onChange((v) => {
                this.type = Status_1.Status.getTypeFromStatusTypeString(v);
            });
        });
        if (Status_1.Status.tasksPluginCanCreateCommandsForStatuses()) {
            // This feature is disabled as not-yet implemented.
            // But we will apply the translation string now, for possible later use.
            new obsidian_1.Setting(settingDiv)
                .setName(i18n_1.i18n.t('modals.customStatusModal.editAvailableAsCommand.name'))
                .setDesc(i18n_1.i18n.t('modals.customStatusModal.editAvailableAsCommand.description'))
                .addToggle((toggle) => {
                toggle.setValue(this.statusAvailableAsCommand).onChange(async (value) => {
                    this.statusAvailableAsCommand = value;
                });
            });
        }
        const footerEl = contentEl.createDiv();
        const footerButtons = new obsidian_1.Setting(footerEl);
        footerButtons.addButton((b) => {
            b.setTooltip('Save')
                .setIcon('checkmark')
                .onClick(async () => {
                const errors = validator.validate(this.statusConfiguration());
                if (errors.length > 0) {
                    const message = errors.join('\n') + '\n\n' + i18n_1.i18n.t('modals.customStatusModal.fixErrorsBeforeSaving');
                    // console.debug(message);
                    new obsidian_1.Notice(message);
                    return;
                }
                this.saved = true;
                this.close();
            });
            return b;
        });
        footerButtons.addExtraButton((b) => {
            b.setIcon('cross')
                .setTooltip('Cancel')
                .onClick(() => {
                this.saved = false;
                this.close();
            });
            return b;
        });
    }
    // updateTitle(admonitionPreview: HTMLElement, title: string) {
    //     let titleSpan = admonitionPreview.querySelector('.admonition-title-content');
    //     let iconEl = admonitionPreview.querySelector('.admonition-title-icon');
    //     titleSpan.textContent = title;
    //     titleSpan.prepend(iconEl);
    // }
    onOpen() {
        this.display();
    }
    static setValidationError(textInput) {
        textInput.inputEl.addClass('tasks-settings-is-invalid');
    }
    static removeValidationError(textInput) {
        textInput.inputEl.removeClass('tasks-settings-is-invalid');
    }
    static setValid(text, messages) {
        const valid = messages.length === 0;
        if (valid) {
            CustomStatusModal.removeValidationError(text);
        }
        else {
            CustomStatusModal.setValidationError(text);
        }
    }
}
exports.CustomStatusModal = CustomStatusModal;
//# sourceMappingURL=CustomStatusModal.js.map