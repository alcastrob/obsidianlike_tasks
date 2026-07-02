"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateParser = void 0;
const chrono = __importStar(require("chrono-node"));
const DateRange_1 = require("./DateRange");
class DateParser {
    static parseDate(input, forwardDate = false) {
        // Using start of day to correctly match on comparison with other dates (like equality).
        return window
            .moment(chrono.parseDate(input, undefined, {
            forwardDate: forwardDate,
        }))
            .startOf('day');
    }
    /**
     * Parse a line and extract a pair of dates, returned in a tuple, sorted by date.
     * @param input - any pair of dates, separate by one or more spaces '17 August 2013 19 August 2013',
     *                or a single date.
     * @param forwardDate - if true, and date is ambiguous, chrono will return dates in the future
     * @return - A Tuple of dates. If both input dates are invalid, then both output dates will be invalid.
     */
    static parseDateRange(input, forwardDate = false) {
        const dateRangeParsers = [
            // Try parsing a relative date range like 'current month'
            DateParser.parseRelativeDateRange,
            // Try '2022-W10' otherwise
            DateParser.parseNumberedDateRange,
            // If previous failed, fallback on absolute date range with chrono
            DateParser.parseAbsoluteDateRange,
        ];
        for (const parser of dateRangeParsers) {
            const parsedDateRange = parser(input, forwardDate);
            if (parsedDateRange.isValid()) {
                return parsedDateRange;
            }
        }
        // If nothing worked return and invalid date range
        return DateRange_1.DateRange.buildInvalid();
    }
    static parseAbsoluteDateRange(input, forwardDate) {
        const result = chrono.parse(input, undefined, {
            forwardDate: forwardDate,
        });
        // Check chrono parsing
        if (result.length === 0) {
            return DateRange_1.DateRange.buildInvalid();
        }
        const startDate = result[0].start;
        const endDate = result[1] && result[1].start ? result[1].start : startDate;
        const start = window.moment(startDate.date());
        const end = window.moment(endDate.date());
        return new DateRange_1.DateRange(start, end);
    }
    static parseRelativeDateRange(input, _forwardDate) {
        const relativeDateRangeRegexp = /(last|this|next) (week|month|quarter|year)/;
        const relativeDateRangeMatch = input.match(relativeDateRangeRegexp);
        if (relativeDateRangeMatch && relativeDateRangeMatch.length === 3) {
            const lastThisNext = relativeDateRangeMatch[1];
            const range = relativeDateRangeMatch[2];
            const dateRange = DateRange_1.DateRange.buildRelative(range);
            switch (lastThisNext) {
                case 'last':
                    dateRange.moveToPrevious(range);
                    break;
                case 'next':
                    dateRange.moveToNext(range);
                    break;
            }
            return dateRange;
        }
        return DateRange_1.DateRange.buildInvalid();
    }
    static parseNumberedDateRange(input, _forwardDate) {
        const parsingVectors = [
            [/^\s*[0-9]{4}\s*$/, 'YYYY', 'year'],
            [/^\s*[0-9]{4}-Q[1-4]\s*$/, 'YYYY-Q', 'quarter'],
            [/^\s*[0-9]{4}-[0-9]{2}\s*$/, 'YYYY-MM', 'month'],
            [/^\s*[0-9]{4}-W[0-9]{2}\s*$/, 'YYYY-WW', 'isoWeek'],
        ];
        for (const [regexp, dateFormat, range] of parsingVectors) {
            const matched = input.match(regexp);
            if (matched) {
                // RegExps allow spaces (\s*), remove them before calling window.moment()
                const date = matched[0].trim();
                return new DateRange_1.DateRange(window.moment(date, dateFormat).startOf(range), window.moment(date, dateFormat).endOf(range));
            }
        }
        return DateRange_1.DateRange.buildInvalid();
    }
}
exports.DateParser = DateParser;
//# sourceMappingURL=DateParser.js.map