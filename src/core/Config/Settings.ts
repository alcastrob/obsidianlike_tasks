/**
 * Minimal stand-in for Obsidian Tasks' plugin-settings store (`src/Config/Settings.ts`).
 *
 * The original plugin persists these in Obsidian's plugin data and exposes a settings UI.
 * For this VS Code port they are fixed to the same defaults Obsidian Tasks ships with,
 * matching the behaviour that most vaults run with out of the box. Wiring these up to
 * real VS Code configuration (`tasksManager.*` settings) is a follow-up, not required
 * for the engine to behave correctly.
 */
export interface CoreSettings {
    setCreatedDate: boolean;
    setDoneDate: boolean;
    setCancelledDate: boolean;
    recurrenceOnNextLine: boolean;
    removeScheduledDateOnRecurrence: boolean;
}

const defaultSettings: CoreSettings = {
    setCreatedDate: false,
    setDoneDate: true,
    setCancelledDate: true,
    recurrenceOnNextLine: false,
    removeScheduledDateOnRecurrence: false,
};

export function getSettings(): CoreSettings {
    return defaultSettings;
}
