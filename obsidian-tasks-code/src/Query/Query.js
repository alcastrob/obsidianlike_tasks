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
exports.Query = void 0;
const Settings_1 = require("../Config/Settings");
const QueryLayoutOptions_1 = require("../Layout/QueryLayoutOptions");
const TaskLayoutOptions_1 = require("../Layout/TaskLayoutOptions");
const ExceptionTools_1 = require("../lib/ExceptionTools");
const logging_1 = require("../lib/logging");
const ExpandPlaceholders_1 = require("../Scripting/ExpandPlaceholders");
const QueryContext_1 = require("../Scripting/QueryContext");
const Presets_1 = require("./Presets/Presets");
const Explainer_1 = require("./Explain/Explainer");
const FilterParser = __importStar(require("./FilterParser"));
const TaskGroups_1 = require("./Group/TaskGroups");
const QueryResult_1 = require("./QueryResult");
const Scanner_1 = require("./Scanner");
const SearchInfo_1 = require("./SearchInfo");
const Sort_1 = require("./Sort/Sort");
const Statement_1 = require("./Statement");
let queryInstanceCounter = 0;
class Query {
    constructor(source, tasksFile = undefined) {
        /** statements contain each source line after processing continuations and placeholders.
         * There may be more statements than lines in the source, if any multi-line query file property values were used. */
        this.statements = [];
        this._limit = undefined;
        this._taskGroupLimit = undefined;
        this._taskLayoutOptions = new TaskLayoutOptions_1.TaskLayoutOptions();
        this._queryLayoutOptions = new QueryLayoutOptions_1.QueryLayoutOptions();
        this.layoutStatements = [];
        this._filters = [];
        this._error = undefined;
        this._sorting = [];
        this._grouping = [];
        this._ignoreGlobalQuery = false;
        this.hideOptionsRegexp = /^(hide|show) +(.*)/i;
        this.shortModeRegexp = /^short/i;
        this.fullModeRegexp = /^full/i;
        this.explainQueryRegexp = /^explain/i;
        this.ignoreGlobalQueryRegexp = /^ignore global query/i;
        this.logger = logging_1.logging.getLogger('tasks.Query');
        this.limitRegexp = /^limit (groups )?(to )?(\d+)( tasks?)?/i;
        this.commentRegexp = /^#.*/;
        this.presetRegexp = /^preset +(.*)/i;
        this._queryId = this.generateQueryId(10);
        this.source = source;
        this.tasksFile = tasksFile;
        const anyContinuationLinesRemoved = (0, Scanner_1.continueLines)(source);
        for (const statement of anyContinuationLinesRemoved) {
            const expandedStatements = this.expandPlaceholders(statement, tasksFile);
            if (this.error !== undefined) {
                // There was an error expanding placeholders.
                return;
            }
            this.statements.push(...expandedStatements);
        }
        for (const statement of this.statements) {
            try {
                this.parseLine(statement);
                if (this.error !== undefined) {
                    return;
                }
            }
            catch (e) {
                let message;
                if (e instanceof Error) {
                    message = e.message;
                }
                else {
                    message = 'Unknown error';
                }
                this.setError(message, statement);
                return;
            }
        }
    }
    /**
     * Remove any instructions that are not valid for Global Queries:
     */
    removeIllegalGlobalQueryInstructions() {
        // It does not make sense to use 'ignore global query'
        // in global queries: the value is ignored, and it would be confusing
        // for 'explain' output to report that it had been supplied:
        this._ignoreGlobalQuery = false;
    }
    get filePath() {
        return this.tasksFile?.path ?? undefined;
    }
    get queryId() {
        return this._queryId;
    }
    parseLine(statement) {
        const line = statement.anyPlaceholdersExpanded;
        switch (true) {
            case this.presetRegexp.test(line):
                this.parsePreset(line, statement);
                break;
            case this.shortModeRegexp.test(line):
                this._queryLayoutOptions.shortMode = true;
                this.saveLayoutStatement(statement);
                break;
            case this.fullModeRegexp.test(line):
                this._queryLayoutOptions.shortMode = false;
                this.saveLayoutStatement(statement);
                break;
            case this.explainQueryRegexp.test(line):
                this._queryLayoutOptions.explainQuery = true;
                // We intentionally do not explain the 'explain' statement, as it clutters up documentation.
                break;
            case this.ignoreGlobalQueryRegexp.test(line):
                this._ignoreGlobalQuery = true;
                break;
            case this.limitRegexp.test(line):
                this.parseLimit(line);
                break;
            case this.parseSortBy(line, statement):
                break;
            case this.parseGroupBy(line, statement):
                break;
            case this.hideOptionsRegexp.test(line):
                this.parseHideOptions(statement);
                break;
            case this.commentRegexp.test(line):
                // Comment lines are ignored
                break;
            case this.parseFilter(line, statement):
                break;
            default:
                this.setError('do not understand query', statement);
        }
    }
    formatQueryForLogging() {
        return `
>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
${this.source}
<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
`;
    }
    expandPlaceholders(statement, tasksFile) {
        const source = statement.anyContinuationLinesRemoved;
        if (source.includes('{{') && source.includes('}}')) {
            if (this.tasksFile === undefined) {
                this._error = `The query looks like it contains a placeholder, with "{{" and "}}"
but no file path has been supplied, so cannot expand placeholder values.
The query is:
${source}`;
                return [statement];
            }
        }
        const isAComment = this.commentRegexp.test(source);
        if (isAComment) {
            // If it's a comment, we return the line un-changed, to avoid:
            // 1. pointless error messages for any harmless unknown placeholders,
            // 2. accidentally processing the second-and-subsequent lines of multi-line placeholders.
            return [statement];
        }
        // TODO Give user error info if they try and put a string in a regex search
        let expandedSource = source;
        if (tasksFile) {
            const queryContext = (0, QueryContext_1.makeQueryContext)(tasksFile);
            let previousExpandedSource = '';
            try {
                // Keep expanding placeholders until no more changes occur or max iterations reached.
                const maxIterations = 10; // Prevent infinite loops if there are any circular references.
                let iterations = 0;
                while (expandedSource !== previousExpandedSource && iterations < maxIterations) {
                    previousExpandedSource = expandedSource;
                    expandedSource = (0, ExpandPlaceholders_1.expandPlaceholders)(previousExpandedSource, queryContext);
                    iterations++;
                }
                if (expandedSource !== source) {
                    expandedSource = (0, Scanner_1.continueLines)(expandedSource)
                        .map((statement) => statement.anyContinuationLinesRemoved)
                        .join('\n');
                }
            }
            catch (error) {
                if (error instanceof Error) {
                    this._error = error.message;
                }
                else {
                    this._error = 'Internal error. expandPlaceholders() threw something other than Error.';
                }
                return [statement];
            }
        }
        return this.createStatementsFromExpandedPlaceholders(expandedSource, statement);
    }
    createStatementsFromExpandedPlaceholders(expandedSource, statement) {
        // Trim and filter empty lines in one step.
        const expandedSourceLines = expandedSource
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
        if (expandedSourceLines.length === 1) {
            // Save the single expanded line back into the statement.
            statement.recordExpandedPlaceholders(expandedSourceLines[0]);
            return [statement];
        }
        // Handle multiple-line placeholders.
        return expandedSourceLines.map((expandedSourceLine, index) => {
            const counter = `: statement ${index + 1} after expansion of placeholder`;
            const newStatement = new Statement_1.Statement(statement.rawInstruction + counter, statement.anyContinuationLinesRemoved + counter);
            newStatement.recordExpandedPlaceholders(expandedSourceLine);
            return newStatement;
        });
    }
    /**
     *
     * Appends {@link q2} to this query.
     *
     * @note At time of writing, this query language appears to play nicely with combining queries.
     *
     * More formally, the concatenation operation on the query language:
     *     * Is closed (concatenating two queries is another valid query)
     *     * Is not commutative (q1.append(q2) !== q2.append(q1))
     *
     * And the semantics of the combination are straight forward:
     *     * Combining two queries appends their filters
     *           (assuming that the filters are pure functions, filter concatenation is commutative)
     *     * Combining two queries appends their sorting instructions. (this is not commutative)
     *     * Combining two queries appends their grouping instructions. (this is not commutative)
     *     * Successive limit instructions overwrite previous ones.
     *
     * @param {Query} q2
     * @return {Query} The combined query
     */
    append(q2) {
        if (this.source === '')
            return q2;
        if (q2.source === '')
            return this;
        return new Query(`${this.source}\n${q2.source}`, this.tasksFile);
    }
    /**
     * Generate a text description of the contents of this query.
     *
     * This does not show any global filter and global query.
     * Use {@link explainResults} if you want to see any global query and global filter as well.
     */
    explainQuery() {
        const explainer = new Explainer_1.Explainer();
        return explainer.explainQuery(this);
    }
    get limit() {
        return this._limit;
    }
    get taskGroupLimit() {
        return this._taskGroupLimit;
    }
    get taskLayoutOptions() {
        return this._taskLayoutOptions;
    }
    get queryLayoutOptions() {
        return this._queryLayoutOptions;
    }
    get filters() {
        return this._filters;
    }
    /**
     * Add a new filter to this Query.
     *
     * At the time of writing, it is intended to allow tests to create filters
     * programatically, for things that can not yet be done via 'filter by function'.
     * @param filter
     */
    addFilter(filter) {
        this._filters.push(filter);
    }
    get sorting() {
        return this._sorting;
    }
    /**
     * Return the {@link Grouper} objects that represent any `group by` instructions in the tasks block.
     */
    get grouping() {
        return this._grouping;
    }
    get error() {
        return this._error;
    }
    setError(message, statement) {
        this._error = Query.generateErrorMessage(statement, message);
    }
    static generateErrorMessage(statement, message) {
        if (statement.allLinesIdentical()) {
            return `${message}
Problem line: "${statement.rawInstruction}"`;
        }
        else {
            return `${message}
Problem statement:
${statement.explainStatement('    ')}
`;
        }
    }
    get ignoreGlobalQuery() {
        return this._ignoreGlobalQuery;
    }
    applyQueryToTasks(tasks) {
        this.debug(`[search] Executing query: ${this.formatQueryForLogging()}`);
        const searchInfo = new SearchInfo_1.SearchInfo(this.tasksFile, tasks);
        // Custom filter (filter by function) does not report the instruction line in any exceptions,
        // for performance reasons. So we keep track of it here.
        let possiblyBrokenStatement = undefined;
        try {
            this.filters.forEach((filter) => {
                possiblyBrokenStatement = filter.statement;
                tasks = tasks.filter((task) => filter.filterFunction(task, searchInfo));
            });
            possiblyBrokenStatement = undefined;
            const { debugSettings } = (0, Settings_1.getSettings)();
            const tasksSorted = debugSettings.ignoreSortInstructions ? tasks : Sort_1.Sort.by(this.sorting, tasks, searchInfo);
            const tasksSortedLimited = tasksSorted.slice(0, this.limit);
            const taskGroups = new TaskGroups_1.TaskGroups(this.grouping, tasksSortedLimited, searchInfo);
            if (this._taskGroupLimit !== undefined) {
                taskGroups.applyTaskLimit(this._taskGroupLimit);
            }
            return new QueryResult_1.QueryResult(taskGroups, tasksSorted.length, this.tasksFile);
        }
        catch (e) {
            const description = 'Search failed';
            let message = (0, ExceptionTools_1.errorMessageForException)(description, e);
            if (possiblyBrokenStatement) {
                message = Query.generateErrorMessage(possiblyBrokenStatement, message);
            }
            return QueryResult_1.QueryResult.fromError(message);
        }
    }
    parseHideOptions(statement) {
        const line = statement.anyPlaceholdersExpanded;
        const hideOptionsMatch = line.match(this.hideOptionsRegexp);
        if (hideOptionsMatch === null) {
            return;
        }
        const hide = hideOptionsMatch[1].toLowerCase() === 'hide';
        const option = hideOptionsMatch[2].toLowerCase();
        if ((0, QueryLayoutOptions_1.parseQueryShowHideOptions)(this._queryLayoutOptions, option, hide)) {
            this.saveLayoutStatement(statement);
            return;
        }
        if ((0, TaskLayoutOptions_1.parseTaskShowHideOptions)(this._taskLayoutOptions, option, !hide)) {
            this.saveLayoutStatement(statement);
            return;
        }
        this.setError('do not understand hide/show option', new Statement_1.Statement(line, line));
    }
    saveLayoutStatement(statement) {
        this.layoutStatements.push(statement);
    }
    parseFilter(line, statement) {
        const filterOrError = FilterParser.parseFilter(line);
        if (filterOrError != null) {
            if (filterOrError.filter) {
                // Overwrite the filter's statement, to preserve details of any
                // continuation lines and placeholder expansions.
                filterOrError.filter.setStatement(statement);
                this._filters.push(filterOrError.filter);
            }
            else {
                this.setError(filterOrError.error ?? 'Unknown error', statement);
            }
            return true;
        }
        return false;
    }
    parseLimit(line) {
        const limitMatch = line.match(this.limitRegexp);
        if (limitMatch === null) {
            this.setError('do not understand query limit', new Statement_1.Statement(line, line));
            return;
        }
        // limitMatch[3] is per regex always digits and therefore parsable.
        const limitFromLine = Number.parseInt(limitMatch[3], 10);
        if (limitMatch[1] !== undefined) {
            this._taskGroupLimit = limitFromLine;
        }
        else {
            this._limit = limitFromLine;
        }
    }
    parseSortBy(line, statement) {
        let sortingMaybe = null;
        try {
            sortingMaybe = FilterParser.parseSorter(line);
        }
        catch (e) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            this.setError(message, statement);
            return true;
        }
        if (sortingMaybe) {
            sortingMaybe.setStatement(statement);
            this._sorting.push(sortingMaybe);
            return true;
        }
        return false;
    }
    /**
     * Parsing of `group by` lines, for grouping that is implemented in the {@link Field}
     * classes.
     *
     * @param line
     * @param statement
     * @private
     */
    parseGroupBy(line, statement) {
        let groupingMaybe;
        try {
            groupingMaybe = FilterParser.parseGrouper(line);
        }
        catch (e) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            this.setError(message, statement);
            return true;
        }
        if (groupingMaybe) {
            groupingMaybe.setStatement(statement);
            this._grouping.push(groupingMaybe);
            return true;
        }
        return false;
    }
    parsePreset(line, statement) {
        const preset = this.presetRegexp.exec(line);
        if (preset) {
            const presetName = preset[1].trim();
            const { presets } = (0, Settings_1.getSettings)();
            const presetValue = presets[presetName];
            if (!presetValue) {
                this.setError((0, Presets_1.unknownPresetErrorMessage)(presetName, presets), statement);
                return;
            }
            // Process the preset text with placeholder expansion
            const instructions = (0, Scanner_1.splitSourceHonouringLineContinuations)(presetValue);
            for (const instruction of instructions) {
                const newStatement = new Statement_1.Statement(statement.rawInstruction, statement.anyContinuationLinesRemoved);
                newStatement.recordExpandedPlaceholders(instruction);
                // Apply placeholder expansion again if needed
                if (instruction.includes('{{') && instruction.includes('}}') && this.tasksFile) {
                    const queryContext = (0, QueryContext_1.makeQueryContext)(this.tasksFile);
                    const expandedInstruction = (0, ExpandPlaceholders_1.expandPlaceholders)(instruction, queryContext);
                    newStatement.recordExpandedPlaceholders(expandedInstruction);
                }
                this.parseLine(newStatement);
            }
        }
    }
    /**
     * Creates a unique ID for correlation of console logging.
     *
     * @private
     * @param {number} length
     * @return {*}  {string}
     */
    generateQueryId(length) {
        queryInstanceCounter += 1;
        return queryInstanceCounter.toString().padStart(length, '0');
    }
    debug(message, objects) {
        this.logger.debugWithId(this._queryId, `"${this.filePath}": ${message}`, objects);
    }
    warn(message, objects) {
        this.logger.warnWithId(this._queryId, `"${this.filePath}": ${message}`, objects);
    }
}
exports.Query = Query;
//# sourceMappingURL=Query.js.map