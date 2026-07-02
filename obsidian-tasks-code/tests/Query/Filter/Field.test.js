"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Field_1 = require("../../../src/Query/Filter/Field");
const CustomMatchersForSorting_1 = require("../../CustomMatchers/CustomMatchersForSorting");
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
class TestFieldSortingUnSupported extends Field_1.Field {
    // Filtering
    createFilterOrErrorMessage(_line) {
        throw new Error(`createFilterOrErrorMessage() unimplemented for ${this.fieldName()}`);
    }
    fieldName() {
        return 'unsupported';
    }
    filterRegExp() {
        throw new Error(`filterRegExp() unimplemented for ${this.fieldName()}`);
    }
}
class DescriptionLengthField extends Field_1.Field {
    // Filtering
    createFilterOrErrorMessage(_line) {
        throw new Error(`createFilterOrErrorMessage() unimplemented for ${this.fieldName()}`);
    }
    fieldName() {
        return 'description-length';
    }
    filterRegExp() {
        throw new Error(`filterRegExp() unimplemented for ${this.fieldName()}`);
    }
    // Sorting
    supportsSorting() {
        return true;
    }
    comparator() {
        return (a, b) => {
            return a.description.length - b.description.length;
        };
    }
}
describe('sorting - base class usability and implementation', () => {
    describe('field not supporting sorting', () => {
        const unsupported = new TestFieldSortingUnSupported();
        it('should not support sorting', () => {
            expect(unsupported.supportsSorting()).toEqual(false);
        });
        it('should not create a comparator', () => {
            const t = () => {
                unsupported.comparator();
            };
            expect(t).toThrow(Error);
        });
        it('should fail to parse a "valid" line', () => {
            const line = 'sort by unsupported';
            const sorting = unsupported.createSorterFromLine(line);
            expect(sorting).toBeNull();
        });
    });
    describe('field supporting sorting', () => {
        const supported = new DescriptionLengthField();
        it('should support sorting', () => {
            expect(supported.supportsSorting()).toEqual(true);
        });
        it('should create a comparator', () => {
            expect(supported.comparator()).not.toBeNull();
        });
        it('should parse a valid line', () => {
            const line = 'sort by description-length';
            const sorting = supported.createSorterFromLine(line);
            expect(sorting).not.toBeNull();
            expect(sorting?.property).toEqual('description-length');
        });
        it('should fail to parse a invalid line', () => {
            const line = 'sort by jsdajhasdfa';
            const sorting = supported.createSorterFromLine(line);
            expect(sorting).toBeNull();
        });
        it('should compare two tasks', () => {
            const sorting = supported.createSorterFromLine('sort by description-length');
            const a = new TaskBuilder_1.TaskBuilder().description('short description').build();
            const b = new TaskBuilder_1.TaskBuilder().description('very looooooooong description').build();
            (0, CustomMatchersForSorting_1.expectTaskComparesBefore)(sorting, a, b);
        });
    });
});
//# sourceMappingURL=Field.test.js.map