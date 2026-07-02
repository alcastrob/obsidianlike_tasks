"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Grouper = void 0;
const Statement_1 = require("../Statement");
/**
 * A named function that is used to determine the group heading name(s) to use for a {@link Task} object.
 *
 * The name is represented in {@link property}.
 *
 * Note: {@link Grouper} objects are typically created by {@link Field.grouper} using the many
 * classes derived from {@link Field}.
 *
 * @see {@link TaskGroups} for how to use {@link Grouper} objects to group tasks together.
 */
class Grouper {
    constructor(instruction, property, grouper, reverse) {
        this._statement = new Statement_1.Statement(instruction, instruction);
        this.property = property;
        this.grouper = grouper;
        this.reverse = reverse;
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
    get statement() {
        return this._statement;
    }
    get instruction() {
        return this._statement.anyPlaceholdersExpanded;
    }
}
exports.Grouper = Grouper;
//# sourceMappingURL=Grouper.js.map