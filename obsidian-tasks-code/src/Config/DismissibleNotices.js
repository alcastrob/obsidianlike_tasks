"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showDismissibleNotice = showDismissibleNotice;
const obsidian_1 = require("obsidian");
const i18n_1 = require("../i18n/i18n");
const Settings_1 = require("./Settings");
function showDismissibleNotice(dontShowAgainKey, msg, settingsSaver) {
    if ((0, Settings_1.getSettings)().dismissedNotices[dontShowAgainKey]) {
        return;
    }
    const fragment = createFragment();
    const message = createDiv();
    message.textContent = msg;
    const label = createEl('label');
    label.addClass('tasks-dismissible-notice-checkbox-label');
    const checkbox = createEl('input');
    checkbox.type = 'checkbox';
    checkbox.addEventListener('change', () => {
        (0, Settings_1.getSettings)().dismissedNotices[dontShowAgainKey] = checkbox.checked;
        void settingsSaver.saveSettings();
    });
    label.appendChild(checkbox);
    label.appendText(' ' + i18n_1.i18n.t('notices.do-not-show-message-again'));
    fragment.appendChild(message);
    fragment.appendChild(label);
    console.warn(msg);
    new obsidian_1.Notice(fragment, 45000);
}
//# sourceMappingURL=DismissibleNotices.js.map