"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ---------------------------------------------------------------------
// CustomMatchersForDates
// ---------------------------------------------------------------------
const CustomMatchersForDates_1 = require("./CustomMatchersForDates");
expect.extend({
    toEqualMoment: CustomMatchersForDates_1.toEqualMoment,
});
// ---------------------------------------------------------------------
// CustomMatchersForExpressions
// ---------------------------------------------------------------------
const CustomMatchersForExpressions_1 = require("./CustomMatchersForExpressions");
expect.extend({
    toEvaluateAs: CustomMatchersForExpressions_1.toEvaluateAs,
});
// ---------------------------------------------------------------------
// CustomMatchersForFilters
// ---------------------------------------------------------------------
const CustomMatchersForFilters_1 = require("./CustomMatchersForFilters");
expect.extend({
    toBeValid: CustomMatchersForFilters_1.toBeValid,
    toHaveExplanation: CustomMatchersForFilters_1.toHaveExplanation,
    toMatchTaskInTaskList: CustomMatchersForFilters_1.toMatchTaskInTaskList,
    toMatchTask: CustomMatchersForFilters_1.toMatchTask,
    toMatchTaskFromLine: CustomMatchersForFilters_1.toMatchTaskFromLine,
    toMatchTaskWithDescription: CustomMatchersForFilters_1.toMatchTaskWithDescription,
    toMatchTaskWithHeading: CustomMatchersForFilters_1.toMatchTaskWithHeading,
    toMatchTaskWithPath: CustomMatchersForFilters_1.toMatchTaskWithPath,
    toMatchTaskWithSearchInfo: CustomMatchersForFilters_1.toMatchTaskWithSearchInfo,
    toMatchTaskWithStatus: CustomMatchersForFilters_1.toMatchTaskWithStatus,
});
// ---------------------------------------------------------------------
// CustomMatchersForGrouping
// ---------------------------------------------------------------------
const CustomMatchersForGrouping_1 = require("./CustomMatchersForGrouping");
expect.extend({
    groupHeadingsToBe: CustomMatchersForGrouping_1.groupHeadingsToBe,
    toSupportGroupingWithProperty: CustomMatchersForGrouping_1.toSupportGroupingWithProperty,
});
// ---------------------------------------------------------------------
// CustomMatchersForRendering
// ---------------------------------------------------------------------
const CustomMatchersForRendering_1 = require("./CustomMatchersForRendering");
expect.extend({
    toHaveAChildSpanWithClass: CustomMatchersForRendering_1.toHaveAChildSpanWithClass,
    toHaveAChildSpanWithClassAndDataAttributes: CustomMatchersForRendering_1.toHaveAChildSpanWithClassAndDataAttributes,
    toHaveAmongDataAttributes: CustomMatchersForRendering_1.toHaveAmongDataAttributes,
    toHaveDataAttributes: CustomMatchersForRendering_1.toHaveDataAttributes,
});
// ---------------------------------------------------------------------
// CustomMatchersForSorting
// ---------------------------------------------------------------------
require("./CustomMatchersForSorting");
// ---------------------------------------------------------------------
// CustomMatchersForTaskBuilder
// ---------------------------------------------------------------------
const CustomMatchersForTaskBuilder_1 = require("./CustomMatchersForTaskBuilder");
expect.extend({
    toBeIdenticalTo: CustomMatchersForTaskBuilder_1.toBeIdenticalTo,
});
// ---------------------------------------------------------------------
// CustomMatchersForTasks
// ---------------------------------------------------------------------
const CustomMatchersForTasks_1 = require("./CustomMatchersForTasks");
expect.extend({
    toMatchMarkdownLines: CustomMatchersForTasks_1.toMatchMarkdownLines,
    toToggleTo: CustomMatchersForTasks_1.toToggleTo,
    toToggleWithRecurrenceInUsersOrderTo: CustomMatchersForTasks_1.toToggleWithRecurrenceInUsersOrderTo,
});
// ---------------------------------------------------------------------
// CustomMatchersForTaskBuilder
// ---------------------------------------------------------------------
const CustomMatchersForTaskSerializer_1 = require("./CustomMatchersForTaskSerializer");
expect.extend({
    toMatchTaskDetails: CustomMatchersForTaskSerializer_1.toMatchTaskDetails,
});
//# sourceMappingURL=jest.custom_matchers.setup.js.map