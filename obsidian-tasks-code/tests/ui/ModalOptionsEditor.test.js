"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = require("../../src/Config/Settings");
const ModalOptionsEditorTestHelpers_1 = require("./ModalOptionsEditorTestHelpers");
const RenderingTestHelpers_1 = require("./RenderingTestHelpers");
afterEach(() => {
    (0, Settings_1.resetSettings)();
});
describe('ModalOptionsEditor snapshot tests', () => {
    it('should match snapshot', () => {
        (0, ModalOptionsEditorTestHelpers_1.verifyModalHTML)();
    });
    it('should match snapshot - all options present even when a random option is absent', () => {
        (0, Settings_1.updateSettings)({ isShownInEditModal: (0, RenderingTestHelpers_1.optionsWithoutARandomField)() });
        (0, ModalOptionsEditorTestHelpers_1.verifyModalHTML)();
    });
});
describe('ModalOptionsEditor settings edit tests', () => {
    let savedSettings;
    beforeEach(() => {
        savedSettings = (0, Settings_1.getSettings)();
    });
    const saveSettings = () => (savedSettings = (0, Settings_1.getSettings)());
    const fields = Object.keys((0, Settings_1.getSettings)().isShownInEditModal);
    it.each(fields)('should set %s as hidden when Apply is clicked', async (field) => {
        const { result, container } = (0, ModalOptionsEditorTestHelpers_1.renderAndCheckModal)(saveSettings);
        await (0, RenderingTestHelpers_1.uncheckCheckbox)(container, field);
        // unchecking has not changed the global settings
        expect((0, Settings_1.getSettings)().isShownInEditModal[field]).toEqual(true);
        (0, ModalOptionsEditorTestHelpers_1.checkAndClickApplyButton)(result);
        // clicking the apply button actually saves the settings globally
        expect((0, Settings_1.getSettings)().isShownInEditModal[field]).toEqual(false);
        // checking that the settings edit would be saved in data.json
        expect(savedSettings.isShownInEditModal[field]).toEqual(false);
    });
    it.each(fields)('should not save changes when Cancel is clicked', async (field) => {
        const { result, container } = (0, ModalOptionsEditorTestHelpers_1.renderAndCheckModal)(saveSettings);
        await (0, RenderingTestHelpers_1.uncheckCheckbox)(container, field);
        (0, ModalOptionsEditorTestHelpers_1.checkAndClickCancelButton)(result);
        // clicking the cancel button has not saved the settings globally
        expect((0, Settings_1.getSettings)().isShownInEditModal[field]).toEqual(true);
        // checking that the settings edit would not be saved in data.json
        expect(savedSettings.isShownInEditModal[field]).toEqual(true);
    });
});
//# sourceMappingURL=ModalOptionsEditor.test.js.map