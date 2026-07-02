"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const TypeDetection_1 = require("../../src/lib/TypeDetection");
const TasksDate_1 = require("../../src/DateTime/TasksDate");
describe('getValueType', () => {
    it('should name values correctly', () => {
        expect((0, TypeDetection_1.getValueType)(5)).toEqual('number');
        expect((0, TypeDetection_1.getValueType)(Number('5'))).toEqual('number');
        expect((0, TypeDetection_1.getValueType)(BigInt(9007199254740991))).toEqual('bigint');
        expect((0, TypeDetection_1.getValueType)(true)).toEqual('boolean');
        expect((0, TypeDetection_1.getValueType)('stuff')).toEqual('string');
        expect((0, TypeDetection_1.getValueType)([])).toEqual('Array');
        expect((0, TypeDetection_1.getValueType)(new Set([1, 2, 3]))).toEqual('Set');
        expect((0, TypeDetection_1.getValueType)(new Map([
            [1, 'one'],
            [2, 'two'],
            [4, 'four'],
        ]))).toEqual('Map');
        expect((0, TypeDetection_1.getValueType)({})).toEqual('Object');
        expect((0, TypeDetection_1.getValueType)(undefined)).toEqual('undefined');
        expect((0, TypeDetection_1.getValueType)(null)).toEqual('null');
        expect((0, TypeDetection_1.getValueType)((0, moment_1.default)('2021-06-20'))).toEqual('Moment');
        expect((0, TypeDetection_1.getValueType)(new TasksDate_1.TasksDate(null))).toEqual('TasksDate');
        const squared = (x) => x * x;
        expect(squared(3)).toEqual(9);
        expect((0, TypeDetection_1.getValueType)(squared)).toEqual('function');
        // https://www.typescriptlang.org/docs/handbook/symbols.html
        expect((0, TypeDetection_1.getValueType)(Symbol('key'))).toEqual('symbol');
    });
});
//# sourceMappingURL=TypeDetection.test.js.map