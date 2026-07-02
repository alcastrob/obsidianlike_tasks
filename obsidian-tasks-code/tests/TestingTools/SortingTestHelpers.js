"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortBy = sortBy;
const Sort_1 = require("../../src/Query/Sort/Sort");
const SearchInfo_1 = require("../../src/Query/SearchInfo");
function sortBy(sorters, tasks) {
    return Sort_1.Sort.by(sorters, tasks, SearchInfo_1.SearchInfo.fromAllTasks(tasks));
}
//# sourceMappingURL=SortingTestHelpers.js.map