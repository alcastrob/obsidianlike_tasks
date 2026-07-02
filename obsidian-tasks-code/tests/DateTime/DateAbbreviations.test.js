"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DateAbbreviations_1 = require("../../src/DateTime/DateAbbreviations");
describe('DateAbbreviations', () => {
    it('should expand abbreviations', () => {
        expect((0, DateAbbreviations_1.doAutocomplete)('td ')).toEqual('today');
        expect((0, DateAbbreviations_1.doAutocomplete)('tm ')).toEqual('tomorrow');
        expect((0, DateAbbreviations_1.doAutocomplete)('yd ')).toEqual('yesterday');
        expect((0, DateAbbreviations_1.doAutocomplete)('tw ')).toEqual('this week');
        expect((0, DateAbbreviations_1.doAutocomplete)('nw ')).toEqual('next week');
        expect((0, DateAbbreviations_1.doAutocomplete)('weekend ')).toEqual('sat');
        expect((0, DateAbbreviations_1.doAutocomplete)('we ')).toEqual('sat');
    });
    it('should expand abbreviations with capital letters', () => {
        expect((0, DateAbbreviations_1.doAutocomplete)('Td ')).toEqual('today');
        expect((0, DateAbbreviations_1.doAutocomplete)('tM ')).toEqual('tomorrow');
        expect((0, DateAbbreviations_1.doAutocomplete)('WeekEnd ')).toEqual('sat');
    });
    it('should not expand other words', () => {
        expect((0, DateAbbreviations_1.doAutocomplete)('sunshine ')).toEqual('sunshine ');
    });
});
//# sourceMappingURL=DateAbbreviations.test.js.map