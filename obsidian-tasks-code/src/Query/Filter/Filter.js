"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Filter = void 0;
const Explanation_1 = require("../Explain/Explanation");
const Statement_1 = require("../Statement");
/**
 * A class that represents a parsed filtering instruction from a tasks code block.
 *
 * It provides access to:
 *
 * - The original {@link instruction}, after processing of continuation lines and placeholders.
 * - An {@link explanation}, showing how the instruction was interpreted.
 * - A {@link statement}, which is a {@link Statement} object that gives access to the original text,
 *   for filters that were created by a {@link Query}.
 * - The {@link filterFunction} - a {@link FilterFunction} which tests whether a task matches the filter
 */
class Filter {
    constructor(instruction, filterFunction, explanation) {
        this._statement = new Statement_1.Statement(instruction, instruction);
        this.explanation = explanation;
        this.filterFunction = filterFunction;
    }
    get statement() {
        return this._statement;
    }
    /**
     * Optionally record more detail about the source statement.
     *
     * In tests, we only care about the actual instruction being parsed and executed.
     * However, in {@link Query}, we want the ability to show user more information.
     */
    setStatement(statement) {
        this._statement = statement;
    }
    get instruction() {
        return this._statement.anyPlaceholdersExpanded;
    }
    explainFilterIndented(indent) {
        const explainedStatement = this._statement.explainStatement(indent);
        if (this.onlyNeedsOneLineExplanation()) {
            return `${explainedStatement}\n`;
        }
        else {
            return `${explainedStatement} =>\n${this.explanation.asString(indent + '  ')}\n`;
        }
    }
    simulateExplainFilter() {
        if (this.onlyNeedsOneLineExplanation()) {
            return this.explanation;
        }
        else {
            return new Explanation_1.Explanation(this.instruction + ' =>', [this.explanation]);
        }
    }
    onlyNeedsOneLineExplanation() {
        return this.explanation.asString('') === this.instruction;
    }
}
exports.Filter = Filter;
//# sourceMappingURL=Filter.js.map