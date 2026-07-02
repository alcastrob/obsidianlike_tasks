"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEditorCallback = exports.getNewCursorPosition = void 0;
const obsidian_1 = require("obsidian");
/**
 * Computes the new absolute position of the cursor so that it is positioned within the inserted text as specified
 * by {@link insertion}.moveTo.
 *
 * @note This function assumes that text was inserted at the beginning of the line, which is
 *       the case when used together with {@link Editor.setLine}. This is a simplifying assumption,
 *       but may result in incorrect behavior if used outside the intended context (i.e. not by {@link toggleDone}).
 *
 *       Example: Assume {@link insertion}=`{text: "Hello World", moveTo: {line: 0, ch: 6}}`, where {@link insertion}.text
 *                had been appended to a line with content "------":  `------Hello World`.
 *                The cursor will be offset to the left by the number of characters that were already on the line.
 *                Resulting in the incorrect result `------|Hello World` instead of the intended `------Hello |World`.
 *
 * @param startPos The starting cursor position
 * @param insertion The inserted text and suggested cursor position within that text
 */
const getNewCursorPosition = (startPos, insertion) => {
    const defaultMoveTo = { line: 0, ch: startPos.ch };
    // Fill in any missing moveTo values using the default
    const moveTo = { ...defaultMoveTo, ...insertion.moveTo };
    // Find the length of the line we're moving the cursor to, so that cursor isn't moved out of bounds
    const destinationLineLength = insertion.text.split('\n')[moveTo.line].length;
    return {
        line: startPos.line + moveTo.line,
        ch: Math.min(moveTo.ch, destinationLineLength),
    };
};
exports.getNewCursorPosition = getNewCursorPosition;
/**
 * Creates an editor callback function that applies a line transformation to the current line.
 *
 * @param lineTransformer - A function that takes the current line and file path, and returns the transformed text
 * @returns An editor callback suitable for use with Obsidian's `editorCheckCallback`
 */
const createEditorCallback = (lineTransformer) => {
    function editorCallback(checking, editor, view) {
        if (checking) {
            if (!(view instanceof obsidian_1.MarkdownView)) {
                // If we are not in a markdown view, the command shouldn't be shown.
                return false;
            }
            // TODO - Decide if we want to only show these commands on lines which are tasks
            return true;
        }
        if (!(view instanceof obsidian_1.MarkdownView)) {
            // Should never happen due to check above.
            return;
        }
        // We are certain we are in the editor due to the check above.
        const path = view.file?.path;
        if (path === undefined) {
            return;
        }
        const origCursorPos = editor.getCursor();
        const lineNumber = origCursorPos.line;
        const line = editor.getLine(lineNumber);
        const insertion = lineTransformer(line, path);
        // If the transformer returns undefined, make no changes
        if (insertion === undefined) {
            return;
        }
        const replacementTextIsNonEmpty = insertion.text.length > 0;
        const taskIsOnLastLine = lineNumber >= editor.lineCount() - 1;
        if (replacementTextIsNonEmpty || taskIsOnLastLine) {
            editor.setLine(lineNumber, insertion.text);
        }
        else {
            // The replacement text is empty, and our line was followed by a new line character,
            // so we delete the line and the new-line, to avoid leaving a blank line in the file.
            const from = { line: lineNumber, ch: 0 };
            const to = { line: lineNumber + 1, ch: 0 };
            editor.replaceRange('', from, to);
        }
        /* Cursor positions are 0-based for both "line" and "ch" offsets.
         * If "ch" offset bigger than the line length, will just continue to next line(s).
         * By default "editor.setLine()" appears to either keep the cursor at the end of the line if it is already there,
         * ...or move it to the beginning if it is anywhere else. Licat explained this on Discord as "sticking" to one side or another.
         */
        editor.setCursor((0, exports.getNewCursorPosition)(origCursorPos, insertion));
    }
    return editorCallback;
};
exports.createEditorCallback = createEditorCallback;
//# sourceMappingURL=CreateEditorCallback.js.map