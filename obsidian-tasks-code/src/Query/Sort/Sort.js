"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sort = void 0;
const StatusTypeField_1 = require("../Filter/StatusTypeField");
const DueDateField_1 = require("../Filter/DueDateField");
const PriorityField_1 = require("../Filter/PriorityField");
const PathField_1 = require("../Filter/PathField");
const UrgencyField_1 = require("../Filter/UrgencyField");
class Sort {
    static by(sorters, tasks, searchInfo) {
        const defaultComparators = this.defaultSorters().map((sorter) => sorter.comparator);
        const userComparators = [];
        for (const sorter of sorters) {
            userComparators.push(sorter.comparator);
        }
        return tasks.sort(Sort.makeCompositeComparator([...userComparators, ...defaultComparators], searchInfo));
    }
    static defaultSorters() {
        return [
            new StatusTypeField_1.StatusTypeField().createNormalSorter(),
            new UrgencyField_1.UrgencyField().createNormalSorter(),
            new DueDateField_1.DueDateField().createNormalSorter(),
            new PriorityField_1.PriorityField().createNormalSorter(),
            new PathField_1.PathField().createNormalSorter(),
        ];
    }
    static makeCompositeComparator(comparators, searchInfo) {
        return (a, b) => {
            for (const comparator of comparators) {
                const result = comparator(a, b, searchInfo);
                if (result !== 0) {
                    return result;
                }
            }
            return 0;
        };
    }
}
exports.Sort = Sort;
//# sourceMappingURL=Sort.js.map