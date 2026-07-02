"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriorityTools = void 0;
const Priority_1 = require("../Task/Priority");
class PriorityTools {
    /**
     * Get the name of a {@link Priority} value, returning 'None' for {@link Priority.None}
     * @param priority
     * @see priorityNameUsingNormal
     */
    static priorityNameUsingNone(priority) {
        let priorityName = 'ERROR';
        switch (priority) {
            case Priority_1.Priority.High:
                priorityName = 'High';
                break;
            case Priority_1.Priority.Highest:
                priorityName = 'Highest';
                break;
            case Priority_1.Priority.Medium:
                priorityName = 'Medium';
                break;
            case Priority_1.Priority.None:
                priorityName = 'None';
                break;
            case Priority_1.Priority.Low:
                priorityName = 'Low';
                break;
            case Priority_1.Priority.Lowest:
                priorityName = 'Lowest';
                break;
        }
        return priorityName;
    }
    /**
     * Get the name of a {@link Priority} value, returning 'Normal' for {@link Priority.None}
     * @param priority
     * @see priorityNameUsingNone
     */
    static priorityNameUsingNormal(priority) {
        return PriorityTools.priorityNameUsingNone(priority).replace('None', 'Normal');
    }
    /**
     * Get the {@link Priority} value from a string. The algorithm is case-insensitive.
     *
     * In case the value was not recognised, {@link Priority.None} will be returned.
     *
     * @param priority - a string containing a name of one the supported {@link Priority} values.
     *                   Capitalisation is ignored.
     * @see priorityNameUsingNormal
     */
    static priorityValue(priority) {
        switch (priority.toLowerCase()) {
            case 'lowest':
                return Priority_1.Priority.Lowest;
            case 'low':
                return Priority_1.Priority.Low;
            case 'medium':
                return Priority_1.Priority.Medium;
            case 'high':
                return Priority_1.Priority.High;
            case 'highest':
                return Priority_1.Priority.Highest;
            default:
                return Priority_1.Priority.None;
        }
    }
}
exports.PriorityTools = PriorityTools;
//# sourceMappingURL=PriorityTools.js.map