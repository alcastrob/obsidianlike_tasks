"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const svelte_1 = require("@testing-library/svelte");
const moment_1 = __importDefault(require("moment/moment"));
const DateEditorWrapper_svelte_1 = __importDefault(require("./DateEditorWrapper.svelte"));
const RenderingTestHelpers_1 = require("./RenderingTestHelpers");
window.moment = moment_1.default;
function renderDateEditorWrapper(componentOptions) {
    const { container } = (0, svelte_1.render)(DateEditorWrapper_svelte_1.default, componentOptions);
    expect(() => container).toBeTruthy();
    return container;
}
function testInputValue(container, inputId, expectedText) {
    const input = (0, RenderingTestHelpers_1.getAndCheckRenderedElement)(container, inputId);
    expect(input.value).toEqual(expectedText);
}
function testDatePickerValue(container, expectedValue) {
    const datePicker = (0, RenderingTestHelpers_1.getAndCheckRenderedElement)(container, 'date-editor-picker');
    expect(datePicker.value).toEqual(expectedValue);
}
async function testTypingInput({ userTyped, expectedLeftText, expectedRightText, expectedReturnedDate, expectedReturnedDateValidity = 'true', }, { forwardOnly } = { forwardOnly: true }) {
    const container = renderDateEditorWrapper({ forwardOnly });
    const dueDateInput = (0, RenderingTestHelpers_1.getAndCheckRenderedElement)(container, 'due');
    await svelte_1.fireEvent.input(dueDateInput, { target: { value: userTyped } });
    testInputValue(container, 'due', expectedLeftText);
    testInputValue(container, 'parsedDateFromDateEditor', expectedRightText);
    testInputValue(container, 'dueDateFromDateEditor', expectedReturnedDate);
    testInputValue(container, 'parsedDateValidFromDateEditor', expectedReturnedDateValidity);
    if (expectedReturnedDateValidity === 'true') {
        testDatePickerValue(container, expectedRightText);
    }
    else {
        const datePicker = container.ownerDocument.getElementById('date-editor-picker');
        expect(datePicker).toBeNull();
    }
}
beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-04-20'));
});
afterEach(() => {
    jest.useRealTimers();
});
describe('date editor wrapper tests', () => {
    it('should initialise fields correctly', () => {
        const container = renderDateEditorWrapper({ forwardOnly: true });
        testInputValue(container, 'due', '');
        testInputValue(container, 'parsedDateFromDateEditor', '<i>no due date</i>');
        testInputValue(container, 'dueDateFromDateEditor', '');
        testDatePickerValue(container, '');
    });
    it('should replace an empty date field with typed date value', async () => {
        await testTypingInput({
            userTyped: '2024-10-01',
            expectedLeftText: '2024-10-01',
            expectedRightText: '2024-10-01',
            expectedReturnedDate: '2024-10-01',
        });
    });
    it('should replace an empty date field with typed abbreviation', async () => {
        await testTypingInput({
            userTyped: 'tm ',
            expectedLeftText: 'tomorrow',
            expectedRightText: '2024-04-21',
            expectedReturnedDate: 'tomorrow',
        });
    });
    it('should show an error message for invalid date', async () => {
        await testTypingInput({
            userTyped: 'blah',
            expectedLeftText: 'blah',
            expectedRightText: '<i>invalid due date</i>',
            expectedReturnedDate: 'blah',
            expectedReturnedDateValidity: 'false',
        });
    });
    it('should select a forward date', async () => {
        await testTypingInput({
            userTyped: 'friday',
            expectedLeftText: 'friday',
            expectedRightText: '2024-04-26',
            expectedReturnedDate: 'friday',
        }, { forwardOnly: true });
    });
    it('should select a backward/earlier date', async () => {
        await testTypingInput({
            userTyped: 'friday',
            expectedLeftText: 'friday',
            expectedRightText: '2024-04-19',
            expectedReturnedDate: 'friday',
        }, { forwardOnly: false });
    });
    it('should pick a date', async () => {
        const container = renderDateEditorWrapper({ forwardOnly: false });
        const datePicker = (0, RenderingTestHelpers_1.getAndCheckRenderedElement)(container, 'date-editor-picker');
        await svelte_1.fireEvent.input(datePicker, { target: { value: '2024-11-03' } });
        expect(datePicker.value).toEqual('2024-11-03');
        testInputValue(container, 'due', '2024-11-03');
        testInputValue(container, 'parsedDateFromDateEditor', '2024-11-03');
        testInputValue(container, 'dueDateFromDateEditor', '2024-11-03');
        testInputValue(container, 'parsedDateValidFromDateEditor', 'true');
    });
});
//# sourceMappingURL=DateEditor.test.js.map