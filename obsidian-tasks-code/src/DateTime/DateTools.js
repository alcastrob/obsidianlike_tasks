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
exports.compareByDate = compareByDate;
exports.parseTypedDateForDisplayUsingFutureDate = parseTypedDateForDisplayUsingFutureDate;
exports.parseTypedDateForSaving = parseTypedDateForSaving;
const chrono = __importStar(require("chrono-node"));
function compareByDate(a, b) {
    if (a !== null && b === null) {
        return -1;
    }
    if (a === null && b !== null) {
        return 1;
    }
    if (!(a !== null && b !== null)) {
        return 0;
    }
    if (a.isValid() && !b.isValid()) {
        return 1;
    }
    else if (!a.isValid() && b.isValid()) {
        return -1;
    }
    if (a.isAfter(b)) {
        return 1;
    }
    else if (a.isBefore(b)) {
        return -1;
    }
    else {
        return 0;
    }
}
/*
    MAINTENANCE NOTE on these Date functions:
        Repetitious date-related code in this file has been extracted
        out in to several parseTypedDateFor....() functions over time.

        There is some similarity between these functions, and also
        some subtle differences.

        Future refactoring to simplify them would be welcomed.

        When editing of Done date is introduced, the functions
        parseTypedDateForDisplayUsingFutureDate() and parseTypedDateForDisplay()
        may collapse in to a single case.
*/
/**
 * Parse and return the entered value for a date field.
 * @param fieldName
 * @param typedDate - what the user has entered, such as '2023-01-23' or 'tomorrow'
 * @param forwardDate
 * @returns the parsed date string. Includes "invalid" if {@code typedDate} was invalid.
 */
function parseTypedDateForDisplay(fieldName, typedDate, forwardDate = undefined) {
    if (!typedDate) {
        return `<i>no ${fieldName} date</i>`;
    }
    const parsed = chrono.parseDate(typedDate, forwardDate, {
        forwardDate: forwardDate != undefined,
    });
    if (parsed !== null) {
        return window.moment(parsed).format('YYYY-MM-DD');
    }
    return `<i>invalid ${fieldName} date</i>`;
}
/**
 * Like {@link parseTypedDateForDisplay} but also accounts for the 'Only future dates' setting.
 * @param fieldName
 * @param typedDate - what the user has entered, such as '2023-01-23' or 'tomorrow'
 * @returns the parsed date string. Includes "invalid" if {@code typedDate} was invalid.
 * @param forwardOnly
 */
function parseTypedDateForDisplayUsingFutureDate(fieldName, typedDate, forwardOnly) {
    return parseTypedDateForDisplay(fieldName, typedDate, forwardOnly ? new Date() : undefined);
}
/**
 * Read the entered value for a date field, and return the value to be saved in the edited task.
 * @param typedDate - what the user has entered, such as '2023-01-23' or 'tomorrow'
 * @param forwardDate
 */
function parseTypedDateForSaving(typedDate, forwardDate) {
    let date = null;
    const parsedDate = chrono.parseDate(typedDate, new Date(), { forwardDate });
    if (parsedDate !== null) {
        date = window.moment(parsedDate);
    }
    return date;
}
//# sourceMappingURL=DateTools.js.map