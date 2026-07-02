"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MenuDividerInstruction_1 = require("../../../src/ui/EditInstructions/MenuDividerInstruction");
const TaskBuilder_1 = require("../../TestingTools/TaskBuilder");
describe('MenuDividerInstruction', () => {
    it('should create an instruction to add a divider to a menu', () => {
        const instruction = new MenuDividerInstruction_1.MenuDividerInstruction();
        const task = new TaskBuilder_1.TaskBuilder().build();
        expect(instruction.instructionDisplayName()).toBe('---');
        expect(instruction.isCheckedForTask(task)).toEqual(false);
        const t = () => {
            instruction.apply(task);
        };
        expect(t).toThrow(Error);
        expect(t).toThrowError('MenuDividerInstruction.apply(): Method not implemented.');
    });
});
//# sourceMappingURL=MenuDividerInstruction.test.js.map