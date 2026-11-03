/**
 * Returns a boolean per line: true if the line is inside a fenced code block (``` or ~~~),
 * including the opening/closing fence lines themselves. Task-looking lines inside such blocks
 * are code samples, not real tasks, and must not be indexed, decorated or given CodeLenses.
 *
 * Follows CommonMark: a closing fence uses the same character as the opener, is at least as long,
 * and carries no info string. An unclosed fence runs to the end of the document.
 */
export function computeFencedLines(lines: readonly string[]): boolean[] {
    const result: boolean[] = new Array(lines.length).fill(false);
    let fenceChar: string | null = null;
    let fenceLen = 0;

    for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^\s*(`{3,}|~{3,})(.*)$/);

        if (fenceChar === null) {
            // A backtick fence's info string can't contain backticks (else it's inline code).
            if (match && !(match[1][0] === '`' && match[2].includes('`'))) {
                fenceChar = match[1][0];
                fenceLen = match[1].length;
                result[i] = true;
            }
            continue;
        }

        result[i] = true;
        if (match && match[1][0] === fenceChar && match[1].length >= fenceLen && match[2].trim() === '') {
            fenceChar = null;
        }
    }

    return result;
}
