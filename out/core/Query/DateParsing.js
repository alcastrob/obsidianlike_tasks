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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseQueryDate = parseQueryDate;
const chrono = __importStar(require("chrono-node"));
const moment_1 = __importDefault(require("moment"));
const TaskRegularExpressions_1 = require("../Task/TaskRegularExpressions");
/**
 * Parse a date expression as used in query filter lines and the task-edit flow (e.g.
 * `2024-01-15`, `today`, `next monday`). Returns null if the text cannot be understood.
 */
function parseQueryDate(text) {
    const trimmed = text.trim();
    if (trimmed === '') {
        return null;
    }
    const strict = (0, moment_1.default)(trimmed, TaskRegularExpressions_1.TaskRegularExpressions.dateFormat, true);
    if (strict.isValid()) {
        return strict;
    }
    const parsed = chrono.parseDate(trimmed, new Date(), { forwardDate: false });
    if (parsed !== null) {
        return (0, moment_1.default)(parsed).startOf('day');
    }
    return null;
}
//# sourceMappingURL=DateParsing.js.map