"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestableTaskSaver = void 0;
exports.menuToString = menuToString;
function menuToString(menu) {
    // @ts-expect-error TS2339: Property 'items' does not exist on type 'MenuType'.
    const items = menu.items;
    return '\n' + items.map((item) => `${item.checked ? 'x' : ' '} ${item.title}`).join('\n');
}
class TestableTaskSaver {
    static async testableTaskSaver(originalTask, newTasks) {
        TestableTaskSaver.taskBeingOverwritten = originalTask;
        TestableTaskSaver.tasksBeingSaved = Array.isArray(newTasks) ? newTasks : [newTasks];
    }
    static reset() {
        TestableTaskSaver.taskBeingOverwritten = undefined;
        TestableTaskSaver.tasksBeingSaved = undefined;
    }
}
exports.TestableTaskSaver = TestableTaskSaver;
//# sourceMappingURL=MenuTestingHelpers.js.map