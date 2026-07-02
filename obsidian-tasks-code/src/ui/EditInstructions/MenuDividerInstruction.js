"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuDividerInstruction = exports.SEPARATOR_INSTRUCTION_DISPLAY_NAME = void 0;
/**
 * A placeholder to indicate that an instruction is meant to be a menu separator.
 */
exports.SEPARATOR_INSTRUCTION_DISPLAY_NAME = '---';
class MenuDividerInstruction {
    apply(_task) {
        throw new Error('MenuDividerInstruction.apply(): Method not implemented.');
    }
    instructionDisplayName() {
        return exports.SEPARATOR_INSTRUCTION_DISPLAY_NAME;
    }
    isCheckedForTask(_task) {
        return false;
    }
}
exports.MenuDividerInstruction = MenuDividerInstruction;
//# sourceMappingURL=MenuDividerInstruction.js.map