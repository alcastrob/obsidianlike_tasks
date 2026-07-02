"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetPriority = void 0;
exports.allPriorityInstructions = allPriorityInstructions;
const Task_1 = require("../../Task/Task");
const PriorityTools_1 = require("../../lib/PriorityTools");
const Priority_1 = require("../../Task/Priority");
/**
 * An instruction class, for editing a {@link Task} object's {@link Priority}.
 */
class SetPriority {
    constructor(priority) {
        this.newPriority = priority;
    }
    apply(task) {
        if (this.isCheckedForTask(task)) {
            // Unchanged: return the input task:
            return [task];
        }
        else {
            return [
                new Task_1.Task({
                    ...task,
                    priority: this.newPriority,
                }),
            ];
        }
    }
    instructionDisplayName() {
        return `Priority: ${PriorityTools_1.PriorityTools.priorityNameUsingNormal(this.newPriority)}`;
    }
    isCheckedForTask(task) {
        return task.priority === this.newPriority;
    }
}
exports.SetPriority = SetPriority;
/**
 * Return all the available instructions for editing task priorities.
 * @todo Add instructions for increasing and decreasing the priority.
 */
function allPriorityInstructions() {
    const allPriorities = [
        Priority_1.Priority.Highest,
        Priority_1.Priority.High,
        Priority_1.Priority.Medium,
        Priority_1.Priority.None,
        Priority_1.Priority.Low,
        Priority_1.Priority.Lowest,
    ];
    const instructions = [];
    for (const priority of allPriorities) {
        instructions.push(new SetPriority(priority));
    }
    return instructions;
}
//# sourceMappingURL=PriorityInstructions.js.map