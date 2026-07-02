"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AllCacheSampleData_1 = require("../Obsidian/AllCacheSampleData");
const MockDataHelpers_1 = require("./MockDataHelpers");
describe('MockDataHelpers', () => {
    it('should give the path to the Markdown file', () => {
        const allSamples = (0, MockDataHelpers_1.listPathAndData)(AllCacheSampleData_1.AllMockDataNames);
        const firstSample = allSamples[0];
        expect(firstSample[0]).toBe('Test Data/all_link_types.md');
    });
});
//# sourceMappingURL=MockDataHelpers.test.js.map