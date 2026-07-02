"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PropertyCategory_1 = require("../../src/lib/PropertyCategory");
describe('PropertyCategory', () => {
    it('should retain values passed to constructor', () => {
        const category = new PropertyCategory_1.PropertyCategory('text', 42);
        expect(category.name).toEqual('text');
        expect(category.sortOrder).toEqual(42);
    });
    it('should include sort order in group text', () => {
        const category = new PropertyCategory_1.PropertyCategory('text', 42);
        expect(category.groupText).toEqual('%%42%% text');
    });
    it('should give empty group text if name was empty', () => {
        const category = new PropertyCategory_1.PropertyCategory('', 42);
        expect(category.groupText).toEqual('');
    });
});
//# sourceMappingURL=PropertyCategory.test.js.map