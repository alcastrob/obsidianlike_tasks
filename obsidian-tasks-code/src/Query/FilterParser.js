"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fieldCreators = void 0;
exports.parseFilter = parseFilter;
exports.parseSorter = parseSorter;
exports.parseGrouper = parseGrouper;
const DescriptionField_1 = require("./Filter/DescriptionField");
const CreatedDateField_1 = require("./Filter/CreatedDateField");
const DoneDateField_1 = require("./Filter/DoneDateField");
const DueDateField_1 = require("./Filter/DueDateField");
const ExcludeSubItemsField_1 = require("./Filter/ExcludeSubItemsField");
const FunctionField_1 = require("./Filter/FunctionField");
const HeadingField_1 = require("./Filter/HeadingField");
const PathField_1 = require("./Filter/PathField");
const PriorityField_1 = require("./Filter/PriorityField");
const ScheduledDateField_1 = require("./Filter/ScheduledDateField");
const StartDateField_1 = require("./Filter/StartDateField");
const HappensDateField_1 = require("./Filter/HappensDateField");
const RecurringField_1 = require("./Filter/RecurringField");
const StatusField_1 = require("./Filter/StatusField");
const TagsField_1 = require("./Filter/TagsField");
const BooleanField_1 = require("./Filter/BooleanField");
const FilenameField_1 = require("./Filter/FilenameField");
const UrgencyField_1 = require("./Filter/UrgencyField");
const StatusNameField_1 = require("./Filter/StatusNameField");
const StatusTypeField_1 = require("./Filter/StatusTypeField");
const RecurrenceField_1 = require("./Filter/RecurrenceField");
const FolderField_1 = require("./Filter/FolderField");
const RootField_1 = require("./Filter/RootField");
const BacklinkField_1 = require("./Filter/BacklinkField");
const CancelledDateField_1 = require("./Filter/CancelledDateField");
const BlockingField_1 = require("./Filter/BlockingField");
const IdField_1 = require("./Filter/IdField");
const DependsOnField_1 = require("./Filter/DependsOnField");
const RandomField_1 = require("./Filter/RandomField");
// When parsing a query the fields are tested one by one according to this order.
// Since BooleanField is a meta-field, which needs to aggregate a few fields together, it is intended to
// be kept last.
// When adding new fields keep this order in mind, putting fields that are more specific before fields that
// may contain them, and keep BooleanField last.
exports.fieldCreators = [
    // NEW_QUERY_INSTRUCTION_EDIT_REQUIRED
    () => new StatusNameField_1.StatusNameField(), // status.name is before status, to avoid ambiguity
    () => new StatusTypeField_1.StatusTypeField(), // status.type is before status, to avoid ambiguity
    () => new StatusField_1.StatusField(),
    () => new RecurringField_1.RecurringField(),
    () => new PriorityField_1.PriorityField(),
    () => new HappensDateField_1.HappensDateField(),
    () => new CancelledDateField_1.CancelledDateField(),
    () => new CreatedDateField_1.CreatedDateField(),
    () => new StartDateField_1.StartDateField(),
    () => new ScheduledDateField_1.ScheduledDateField(),
    () => new DueDateField_1.DueDateField(),
    () => new DoneDateField_1.DoneDateField(),
    () => new PathField_1.PathField(),
    () => new FolderField_1.FolderField(),
    () => new RootField_1.RootField(),
    () => new BacklinkField_1.BacklinkField(),
    () => new DescriptionField_1.DescriptionField(),
    () => new TagsField_1.TagsField(),
    () => new HeadingField_1.HeadingField(),
    () => new ExcludeSubItemsField_1.ExcludeSubItemsField(),
    () => new FilenameField_1.FilenameField(),
    () => new UrgencyField_1.UrgencyField(),
    () => new RecurrenceField_1.RecurrenceField(),
    () => new FunctionField_1.FunctionField(),
    () => new IdField_1.IdField(),
    () => new DependsOnField_1.DependsOnField(),
    () => new BlockingField_1.BlockingField(),
    () => new RandomField_1.RandomField(),
    () => new BooleanField_1.BooleanField(), // --- Please make sure to keep BooleanField last (see comment above) ---
];
function parseFilter(filterString) {
    for (const creator of exports.fieldCreators) {
        const field = creator();
        if (field.canCreateFilterForLine(filterString))
            return field.createFilterOrErrorMessage(filterString);
    }
    return null;
}
function parseSorter(sorterString) {
    // New style parsing, using sorting which is done by the Field classes.
    // Optimisation: Check whether line begins with 'sort by'
    const sortByRegexp = /^sort by /i;
    if (sorterString.match(sortByRegexp) === null) {
        return null;
    }
    // See if any of the fields can parse the line.
    for (const creator of exports.fieldCreators) {
        const field = creator();
        const sorter = field.createSorterFromLine(sorterString);
        if (sorter) {
            return sorter;
        }
    }
    return null;
}
function parseGrouper(line) {
    // New style parsing, using grouping which is done by the Field classes.
    // Optimisation: Check whether line begins with 'group by'
    const groupByRegexp = /^group by /i;
    if (line.match(groupByRegexp) === null) {
        return null;
    }
    // See if any of the fields can parse the line.
    for (const creator of exports.fieldCreators) {
        const field = creator();
        const grouper = field.createGrouperFromLine(line);
        if (grouper) {
            return grouper;
        }
    }
    return null;
}
//# sourceMappingURL=FilterParser.js.map