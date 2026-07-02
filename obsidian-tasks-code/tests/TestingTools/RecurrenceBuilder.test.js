"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const moment_1 = __importDefault(require("moment"));
const RecurrenceBuilder_1 = require("./RecurrenceBuilder");
window.moment = moment_1.default;
describe('RecurrenceBuilder', () => {
    it('should build a Recurrence object', () => {
        const builder = new RecurrenceBuilder_1.RecurrenceBuilder();
        const recurrence = builder.rule('every week when done').startDate('2022-07-14').build();
        expect(recurrence).not.toEqual(null);
        expect(recurrence.toText()).toBe('every week when done');
    });
});
//# sourceMappingURL=RecurrenceBuilder.test.js.map