"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Commands = exports.ToggleTaskDoneCommandName = void 0;
const StatusRegistry_1 = require("../Statuses/StatusRegistry");
const CreateOrEdit_1 = require("./CreateOrEdit");
const ToggleDone_1 = require("./ToggleDone");
const AddQueryFileDefaultsProperties_1 = require("./AddQueryFileDefaultsProperties");
const ChangeStatusCommands_1 = require("./ChangeStatusCommands");
exports.ToggleTaskDoneCommandName = 'Toggle task done';
class Commands {
    get app() {
        return this.plugin.app;
    }
    constructor({ plugin }) {
        this.plugin = plugin;
        plugin.addCommand({
            id: 'edit-task',
            name: 'Create or edit task',
            icon: 'pencil',
            editorCheckCallback: (checking, editor, view) => {
                // TODO Need to explore what happens if a tasks code block is rendered before the Cache has been created.
                return (0, CreateOrEdit_1.createOrEdit)(checking, editor, view, this.app, this.plugin.getTasks(), async () => await this.plugin.saveSettings());
            },
        });
        plugin.addCommand({
            id: 'toggle-done',
            name: exports.ToggleTaskDoneCommandName,
            icon: 'check-in-circle',
            editorCheckCallback: ToggleDone_1.toggleDone,
        });
        plugin.addCommand({
            id: 'add-query-file-defaults-properties',
            name: 'Add all Query File Defaults properties',
            icon: 'settings',
            checkCallback: (checking) => {
                const activeFile = this.app.workspace.getActiveFile();
                if (!activeFile) {
                    return false;
                }
                if (activeFile.extension !== 'md') {
                    return false;
                }
                if (!checking) {
                    this.ensureQueryFileDefaultsFrontmatter(activeFile).catch(console.error);
                }
                return true;
            },
        });
        // Register set-status commands for each registered status
        const setStatusCommands = (0, ChangeStatusCommands_1.createSetStatusCommands)(StatusRegistry_1.StatusRegistry.getInstance());
        for (const command of setStatusCommands) {
            plugin.addCommand(command);
        }
    }
    async ensureQueryFileDefaultsFrontmatter(file) {
        const { app } = this;
        await (0, AddQueryFileDefaultsProperties_1.ensureQueryFileDefaultsInFrontmatter)(app, file);
    }
}
exports.Commands = Commands;
//# sourceMappingURL=index.js.map