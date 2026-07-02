"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SearchInfo_1 = require("../../src/Query/SearchInfo");
const TaskBuilder_1 = require("../TestingTools/TaskBuilder");
const FilterOrErrorMessage_1 = require("../../src/Query/Filter/FilterOrErrorMessage");
const Filter_1 = require("../../src/Query/Filter/Filter");
const Explanation_1 = require("../../src/Query/Explain/Explanation");
describe('CustomMatchersForFilters', () => {
    it('should check filter with supplied SearchInfo', () => {
        // Arrange
        const task = new TaskBuilder_1.TaskBuilder().build();
        const initialSearchInfo = SearchInfo_1.SearchInfo.fromAllTasks([task]);
        const checkSearchInfoPassedThrough = (_task, searchInfo) => {
            return Object.is(initialSearchInfo, searchInfo);
        };
        const filter = FilterOrErrorMessage_1.FilterOrErrorMessage.fromFilter(new Filter_1.Filter('stuff', checkSearchInfoPassedThrough, new Explanation_1.Explanation('explanation of stuff')));
        // Act, Assert
        expect(filter).toMatchTaskWithSearchInfo(task, initialSearchInfo);
    });
});
//# sourceMappingURL=CustomMatchersForFilters.test.js.map