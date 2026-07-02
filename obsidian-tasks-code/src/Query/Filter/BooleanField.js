"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BooleanField = void 0;
const boon_js_1 = require("boon-js");
const types_1 = require("boon-js/lib/types");
const FilterParser_1 = require("../FilterParser");
const Explanation_1 = require("../Explain/Explanation");
const Field_1 = require("./Field");
const FilterOrErrorMessage_1 = require("./FilterOrErrorMessage");
const Filter_1 = require("./Filter");
const BooleanDelimiters_1 = require("./BooleanDelimiters");
const BooleanPreprocessor_1 = require("./BooleanPreprocessor");
/**
 * BooleanField is a 'container' field type that parses a high-level filtering query of
 * the format --
 *    (filter1) AND ((filter2) OR (filter3))
 * The filters can be mixed and matched with any boolean operators as long as the individual filters are
 * wrapped in either parenthesis or quotes -- (filter1) or "filter1".
 * What happens internally is that when the boolean field is asked to create a filter, it parses the boolean
 * query into a logical postfix expression (https://en.wikipedia.org/wiki/Reverse_Polish_notation),
 * with the individual filter components as "identifier" tokens.
 * These identifiers have an associated actual Filter (which is cached during the query parsing).
 * The returned Filter of the whole boolean query is eventually a function that for each Task object,
 * evaluates the complete postfix expression by going through the individual filters and then resolving
 * the expression into a single boolean entity.
 */
class BooleanField extends Field_1.Field {
    constructor() {
        super();
        this.supportedOperators = ['AND', 'OR', 'XOR', 'NOT'];
        this.subFields = {};
        // First pattern in this matches conventional (filter1) OR (filter2) and similar
        // Second pattern matches (filter1) - that is, ensures that a single filter is treated as valid
        const delimiters = BooleanDelimiters_1.BooleanDelimiters.allSupportedDelimiters();
        this.basicBooleanRegexp = new RegExp('(.*(AND|OR|XOR|NOT)\\s*' +
            delimiters.openFilter +
            '.*|' +
            delimiters.openFilter +
            '.+' +
            delimiters.closeFilter +
            ')', 'g');
    }
    filterRegExp() {
        return this.basicBooleanRegexp;
    }
    createFilterOrErrorMessage(line) {
        return this.parseLine(line);
    }
    fieldName() {
        return 'boolean query';
    }
    /**
     * This builds a Filter for a complete boolean query by:
     * 1. Preprocessing the expression into something our helper package, boon-js, knows how to build an expression for.
     * 2. Creating a postfix logical expression using boon-js, which has -
     *    a. Identifiers (leaves), which are regular Field filters represented as their string.
     *    b. Operators, which are logical operators between identifiers or between parenthesis.
     * 3. Creating the filter functions for all the Identifiers in the expression and caching them in this.subFields.
     * 4. Returning a final function filter, which for each Task can run the complete query.
     */
    parseLine(line) {
        if (line.length === 0) {
            return FilterOrErrorMessage_1.FilterOrErrorMessage.fromError(line, 'empty line');
        }
        let delimiters;
        try {
            delimiters = BooleanDelimiters_1.BooleanDelimiters.fromInstructionLine(line);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'unknown error type';
            return FilterOrErrorMessage_1.FilterOrErrorMessage.fromError(line, this.helpMessageFromSimpleError(line, message));
        }
        const parseResult = BooleanPreprocessor_1.BooleanPreprocessor.preprocessExpression(line, delimiters);
        const simplifiedLine = parseResult.simplifiedLine;
        const filters = parseResult.filters;
        try {
            // Convert the (preprocessed) line into a postfix logical expression
            const postfixExpression = (0, boon_js_1.parse)(simplifiedLine);
            // Construct sub-field map, i.e. have subFields include a filter function for every
            // final token in the expression
            for (const token of postfixExpression) {
                if (token.name === types_1.Tokens.IDENTIFIER && token.value) {
                    const placeholder = token.value.trim();
                    const filter = filters[placeholder];
                    token.value = filter;
                    if (!(filter in this.subFields)) {
                        const parsedField = (0, FilterParser_1.parseFilter)(filter);
                        if (parsedField === null) {
                            return this.helpMessage(line, `couldn't parse sub-expression '${filter}'`, parseResult);
                        }
                        if (parsedField.error) {
                            return this.helpMessage(line, `couldn't parse sub-expression '${filter}': ${parsedField.error}`, parseResult);
                        }
                        else if (parsedField.filter) {
                            this.subFields[filter] = parsedField.filter;
                        }
                    }
                }
                else if (token.name === types_1.Tokens.OPERATOR) {
                    // While we're already iterating over the expression, although we don't need the operators at
                    // this stage but only in filterTaskWithParsedQuery below, we're using the opportunity to verify
                    // they are valid. If we won't, then an invalid operator will only be detected when the query is
                    // run on a task
                    if (token.value == undefined) {
                        return this.helpMessage(line, 'empty operator in boolean query', parseResult);
                    }
                    if (!this.supportedOperators.includes(token.value)) {
                        return this.helpMessage(line, `unknown boolean operator '${token.value}'`, parseResult);
                    }
                }
            }
            // Return the filter with filter function that can run the complete query
            const filterFunction = (task, searchInfo) => {
                return this.filterTaskWithParsedQuery(task, postfixExpression, searchInfo);
            };
            const explanation = this.constructExplanation(postfixExpression);
            return FilterOrErrorMessage_1.FilterOrErrorMessage.fromFilter(new Filter_1.Filter(line, filterFunction, explanation));
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'unknown error type';
            return this.helpMessage(line, `malformed boolean query -- ${message} (check the documentation for guidelines)`, parseResult);
        }
    }
    /*
     * This run a Task object through a complete boolean expression.
     * It basically resolves the postfix expression until it is reduced into a single boolean value,
     * which is the result of the complete expression.
     * See here how it works: http://www.btechsmartclass.com/data_structures/postfix-evaluation.html
     * Another reference: https://www.tutorialspoint.com/Evaluate-Postfix-Expression
     */
    filterTaskWithParsedQuery(task, postfixExpression, searchInfo) {
        const toBool = (s) => {
            return s === 'true';
        };
        const toString = (b) => {
            return b ? 'true' : 'false';
        };
        const booleanStack = [];
        for (const token of postfixExpression) {
            if (token.name === types_1.Tokens.IDENTIFIER) {
                // Identifiers are the sub-fields of the expression, the actual filters, e.g. 'description includes foo'.
                // For each identifier we created earlier the corresponding Filter, so now we can just evaluate the given
                // task for each identifier that we find in the postfix expression.
                if (token.value == null)
                    throw new Error('null token value'); // This should not happen
                const filter = this.subFields[token.value.trim()];
                const result = filter.filterFunction(task, searchInfo);
                booleanStack.push(toString(result));
            }
            else if (token.name === types_1.Tokens.OPERATOR) {
                // To evaluate an operator we need to pop the required number of items from the boolean stack,
                // do the logical evaluation and push back the result
                if (token.value === 'NOT') {
                    const arg1 = toBool(booleanStack.pop());
                    booleanStack.push(toString(!arg1));
                }
                else if (token.value === 'OR') {
                    const arg1 = toBool(booleanStack.pop());
                    const arg2 = toBool(booleanStack.pop());
                    booleanStack.push(toString(arg1 || arg2));
                }
                else if (token.value === 'AND') {
                    const arg1 = toBool(booleanStack.pop());
                    const arg2 = toBool(booleanStack.pop());
                    booleanStack.push(toString(arg1 && arg2));
                }
                else if (token.value === 'XOR') {
                    const arg1 = toBool(booleanStack.pop());
                    const arg2 = toBool(booleanStack.pop());
                    booleanStack.push(toString((arg1 && !arg2) || (!arg1 && arg2)));
                }
                else {
                    throw new Error('Unsupported operator: ' + token.value);
                }
            }
            else {
                throw new Error('Unsupported token type: ' + token);
            }
        }
        // Eventually the result of the expression for this Task is the only item left in the boolean stack
        return toBool(booleanStack[0]);
    }
    /**
     * Construct an {@link Explanation} representing the complete Boolean instruction currently being analysed.
     *
     * @param postfixExpression
     */
    constructExplanation(postfixExpression) {
        // For an explanation of the code, see the JSdoc and comments of filterTaskWithParsedQuery()
        const explanationStack = [];
        for (const token of postfixExpression) {
            if (token.name === types_1.Tokens.IDENTIFIER) {
                this.explainExpression(token, explanationStack);
            }
            else if (token.name === types_1.Tokens.OPERATOR) {
                this.explainOperator(token, explanationStack);
            }
            else {
                throw new Error('Unsupported token type: ' + token.name);
            }
        }
        // Eventually the Explanation is the only item left in the boolean stack
        return explanationStack[0];
    }
    explainExpression(token, explanationStack) {
        if (token.value == null) {
            throw new Error('null token value'); // This should not happen
        }
        const filter = this.subFields[token.value.trim()];
        const explanation = this.simulateExplainFilter(filter);
        explanationStack.push(explanation);
    }
    simulateExplainFilter(filter) {
        // In our caller, the explanationStack keeps the explanations but not the instruction lines.
        // So to replicate the logic in Filter.explainFilterIndented(), we may need to add the
        // instruction to the explanation.
        return filter.simulateExplainFilter();
    }
    explainOperator(token, explanationStack) {
        // To evaluate an operator we need to pop the required number of items from the boolean stack,
        // do the logical evaluation and push back the result
        if (token.value === 'NOT') {
            const arg1 = explanationStack.pop();
            explanationStack.push(Explanation_1.Explanation.booleanNot([arg1]));
        }
        else if (token.value === 'OR') {
            const arg2 = explanationStack.pop();
            const arg1 = explanationStack.pop();
            explanationStack.push(Explanation_1.Explanation.booleanOr([arg1, arg2]));
        }
        else if (token.value === 'AND') {
            const arg2 = explanationStack.pop();
            const arg1 = explanationStack.pop();
            explanationStack.push(Explanation_1.Explanation.booleanAnd([arg1, arg2]));
        }
        else if (token.value === 'XOR') {
            const arg2 = explanationStack.pop();
            const arg1 = explanationStack.pop();
            explanationStack.push(Explanation_1.Explanation.booleanXor([arg1, arg2]));
        }
        else {
            throw new Error('Unsupported operator: ' + token.value);
        }
    }
    /**
     * Helper to provide useful information to users, when we fail to interpret a Boolean filter.
     */
    helpMessage(line, errorMessage, parseResult) {
        const filters = parseResult.filters;
        const expressions = this.stringifySubExpressionsForErrorMessage(filters);
        const simpleMessage = this.helpMessageFromSimpleError(line, errorMessage);
        const fullMessage = `${simpleMessage}

The instruction was converted to the following simplified line:
    ${parseResult.simplifiedLine}

Where the sub-expressions in the simplified line are:
${expressions}

For help, see:
    https://publish.obsidian.md/tasks/Queries/Combining+Filters
`;
        return FilterOrErrorMessage_1.FilterOrErrorMessage.fromError(line, fullMessage);
    }
    stringifySubExpressionsForErrorMessage(filters) {
        return Object.entries(filters)
            .map(([placeholder, line]) => {
            // Tell the user whether the sub-expression is valid, to work out which ones need fixing.
            return `    '${placeholder}': '${line}'
        => ${this.stringifySubExpressionStatus(line)}`;
        })
            .join('\n');
    }
    stringifySubExpressionStatus(line) {
        const parsedField = (0, FilterParser_1.parseFilter)(line);
        if (!parsedField) {
            return 'ERROR:\n           do not understand query';
        }
        if (parsedField.error) {
            // In case the error message has more than one line, we split it in to separate lines,
            // apply some standard/tidy indentation, and join the lines again:
            const formattedFilterStatus = parsedField.error
                .split('\n')
                .map((line) => line.trim())
                .join('\n           ');
            return `ERROR:\n           ${formattedFilterStatus}`;
        }
        return 'OK';
    }
    helpMessageFromSimpleError(line, errorMessage) {
        return `Could not interpret the following instruction as a Boolean combination:
    ${line}

The error message is:
    ${errorMessage}`;
    }
}
exports.BooleanField = BooleanField;
//# sourceMappingURL=BooleanField.js.map