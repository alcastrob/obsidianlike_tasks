"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateRelativeDate = calculateRelativeDate;
const DateParser_1 = require("../../src/DateTime/DateParser");
/**
 * Create a date string that is a certain number of days away from the given date.
 * This allows tests to be expressed in terms of numbers of days difference, rather
 * than having to construct two different date strings, with future maintainers
 * needing to work out what the difference was.
 * @param today - The starting date
 * @param daysInFuture - The number of days to add...
 *                       Positive numbers give future dates.
 *                       Negative numbers give past dayes.
 */
function calculateRelativeDate(today, daysInFuture) {
    const todayAsDate = DateParser_1.DateParser.parseDate(today);
    const relativeDate = todayAsDate.add(daysInFuture, 'd');
    return relativeDate.format('YYYY-MM-DD');
}
//# sourceMappingURL=DateTestHelpers.js.map