"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toBeIdenticalTo = toBeIdenticalTo;
function toBeIdenticalTo(builder1, builder2) {
    const task1 = builder1.build();
    const task2 = builder2.build();
    const pass = task1.identicalTo(task2);
    if (pass) {
        return {
            message: () => 'Tasks treated as identical, but should be different',
            pass: true,
        };
    }
    return {
        message: () => {
            return 'Tasks should be identical, but are treated as different';
        },
        pass: false,
    };
}
//# sourceMappingURL=CustomMatchersForTaskBuilder.js.map