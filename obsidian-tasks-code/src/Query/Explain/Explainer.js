"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Explainer = void 0;
const Settings_1 = require("../../Config/Settings");
class Explainer {
    /**
     * Constructor.
     * @param indentation - the indentation to use for the output. Defaults to 'not indented'.
     */
    constructor(indentation = '') {
        this.indentation = indentation;
    }
    /**
     * Generate a text description of the contents of a query.
     *
     * This does not show any global filter and global query.
     * Use {@link explainResults} if you want to see any global query and global filter as well.
     */
    explainQuery(query) {
        if (query.error !== undefined) {
            return this.explainError(query);
        }
        /**
         * Each function result should:
         * - either:
         *     - be empty, if there is no information,
         * - or:
         *     - begin with a non-newline,
         *     - end with a single newline.
         */
        const results = [];
        results.push(this.explainIgnoreGlobalQuery(query));
        results.push(this.explainFilters(query));
        results.push(this.explainGroups(query));
        results.push(this.explainSorters(query));
        results.push(this.explainLayout(query));
        results.push(this.explainQueryLimits(query));
        results.push(this.explainDebugSettings());
        return results.filter((explanation) => explanation !== '').join('\n');
    }
    explainError(query) {
        let result = '';
        result += 'Query has an error:\n';
        result += query.error + '\n';
        return result;
    }
    explainIgnoreGlobalQuery(query) {
        if (!query.ignoreGlobalQuery) {
            return '';
        }
        return this.indent('ignore global query\n');
    }
    explainFilters(query) {
        if (query.filters.length === 0) {
            return this.indent('No filters supplied. All tasks will match the query.\n');
        }
        return query.filters.map((filter) => filter.explainFilterIndented(this.indentation)).join('\n');
    }
    explainGroups(query) {
        return this.explainStatements(query.grouping.map((group) => group.statement));
    }
    explainSorters(query) {
        return this.explainStatements(query.sorting.map((sort) => sort.statement));
    }
    explainLayout(query) {
        return this.explainStatements(query.layoutStatements);
    }
    explainQueryLimits(query) {
        function getPluralisedText(limit) {
            let text = `At most ${limit} task`;
            if (limit !== 1) {
                text += 's';
            }
            return text;
        }
        const results = [];
        if (query.limit !== undefined) {
            const result = getPluralisedText(query.limit) + '.\n';
            results.push(this.indent(result));
        }
        if (query.taskGroupLimit !== undefined) {
            const result = getPluralisedText(query.taskGroupLimit) + ' per group (if any "group by" options are supplied).\n';
            results.push(this.indent(result));
        }
        return results.join('\n');
    }
    explainDebugSettings() {
        let result = '';
        const { debugSettings } = (0, Settings_1.getSettings)();
        if (debugSettings.ignoreSortInstructions) {
            result += this.indent("NOTE: All sort instructions, including default sort order, are disabled, due to 'ignoreSortInstructions' setting.\n");
        }
        return result;
    }
    explainStatements(statements) {
        if (statements.length === 0) {
            return '';
        }
        return statements.map((statement) => statement.explainStatement(this.indentation)).join('\n\n') + '\n';
    }
    indent(description) {
        return this.indentation + description;
    }
}
exports.Explainer = Explainer;
//# sourceMappingURL=Explainer.js.map