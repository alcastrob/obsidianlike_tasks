"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyMarkdown = verifyMarkdown;
exports.verifyMarkdownForDocs = verifyMarkdownForDocs;
const Options_1 = require("approvals/lib/Core/Options");
const JestApprovals_1 = require("approvals/lib/Providers/Jest/JestApprovals");
const JestReporter_1 = require("approvals/lib/Providers/Jest/JestReporter");
// import { AutoApprovingReporter } from './AutoApprovingReporter';
function verifyMarkdown(output) {
    let options = new Options_1.Options();
    options = options.forFile().withFileExtention('md');
    // TODO Move this to somewhere where it is picked up by all tests, not just ones
    //      that use this function.
    const configModifier = (c) => {
        c.reporters = [
            /*
                Uncomment AutoApprovingReporter() if you want to auto-fix
                any failing ApprovalTest tests.
                YOU MUST THEN REVIEW THE DIFFERENCES CAREFULLY, before committing.
            */
            // new AutoApprovingReporter(),
            //-----------------
            // Built-in reporters listed at:
            // https://github.com/approvals/Approvals.NodeJS#built-in-reporters
            'vscode', // VS Code diff works well with files containing emojis
            //-----------------
            // Last one is jest reporter, that writes diffs to console in
            // Continuous Integration builds, such as GitHub Actions,
            // or when the development environment has no supported diff tools.
            new JestReporter_1.JestReporter(),
        ];
        return c;
    };
    (0, JestApprovals_1.verify)(output, options.withConfig(configModifier));
}
/**
 * Write out markdown block for including directly in documentation.
 * To embed the approved file directly in user docs, write line like this, and then run mdsnippets:
 *      include: output-file-name.approved.md
 * @param markdown
 */
function verifyMarkdownForDocs(markdown) {
    let output = '<!-- placeholder to force blank line before included text -->\n\n';
    output += markdown;
    output += '\n\n<!-- placeholder to force blank line after included text -->\n';
    verifyMarkdown(output);
}
//# sourceMappingURL=VerifyMarkdown.js.map