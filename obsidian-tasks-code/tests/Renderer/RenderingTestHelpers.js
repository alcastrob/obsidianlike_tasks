"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockTextRenderer = exports.mockHTMLRenderer = void 0;
exports.makeHtmlQueryRendererParameters = makeHtmlQueryRendererParameters;
exports.createMarkdownRenderer = createMarkdownRenderer;
exports.renderMarkdown = renderMarkdown;
exports.tasksMarkdownAndPrettifiedHtml = tasksMarkdownAndPrettifiedHtml;
exports.verifyRenderedTasks = verifyRenderedTasks;
const Cache_1 = require("../../src/Obsidian/Cache");
const Query_1 = require("../../src/Query/Query");
const MarkdownQueryResultsRenderer_1 = require("../../src/Renderer/MarkdownQueryResultsRenderer");
const ApprovalTestHelpers_1 = require("../TestingTools/ApprovalTestHelpers");
const HTMLHelpers_1 = require("../TestingTools/HTMLHelpers");
const TestHelpers_1 = require("../TestingTools/TestHelpers");
const TasksFileHelpers_1 = require("../TestingTools/TasksFileHelpers");
const mockHTMLRenderer = async (_obsidianApp, text, element, _path) => {
    // Contrary to the default mockTextRenderer(),
    // instead of the rendered HTMLSpanElement.innerText,
    // we need the plain HTML here like in TaskLineRenderer.renderComponentText(),
    // to ensure that description and tags are retained.
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    while (doc.body.firstChild) {
        element.appendChild(doc.body.firstChild);
    }
};
exports.mockHTMLRenderer = mockHTMLRenderer;
const mockTextRenderer = async (_obsidianApp, text, element, _path) => {
    element.innerText = text;
};
exports.mockTextRenderer = mockTextRenderer;
function makeHtmlQueryRendererParameters(allTasks) {
    return {
        allTasks: () => allTasks,
        allMarkdownFiles: () => [],
        backlinksClickHandler: () => Promise.resolve(),
        backlinksMousedownHandler: () => Promise.resolve(),
        editTaskPencilClickHandler: () => { },
    };
}
function createMarkdownRenderer(source) {
    const tasksFile = (0, TasksFileHelpers_1.createTestTasksFile)('query.md');
    const query = new Query_1.Query(source, tasksFile);
    const renderer = new MarkdownQueryResultsRenderer_1.MarkdownQueryResultsRenderer(source, tasksFile, query);
    return { renderer, query };
}
async function renderMarkdown(source, tasks) {
    const { renderer, query } = createMarkdownRenderer(source);
    const queryResult = query.applyQueryToTasks(tasks);
    await renderer.renderQuery(Cache_1.State.Warm, queryResult);
    return {
        markdown: '\n' + renderer.markdown,
        queryResult,
        rerenderWithFilter: async (filter) => {
            expect(filter).toBeValid();
            const filteredResult = queryResult.applyFilter(filter.filter);
            await renderer.renderQuery(Cache_1.State.Warm, filteredResult);
            return { filteredMarkdown: '\n' + renderer.markdown };
        },
    };
}
function tasksMarkdownAndPrettifiedHtml(container, allTasks) {
    const tasksAsMarkdown = `<!--
${(0, TestHelpers_1.toMarkdown)(allTasks)}
-->\n\n`;
    const prettyHTML = (0, HTMLHelpers_1.prettifyHTML)(container.outerHTML);
    return { tasksAsMarkdown, prettyHTML };
}
function verifyRenderedTasks(container, allTasks) {
    const { tasksAsMarkdown, prettyHTML } = tasksMarkdownAndPrettifiedHtml(container, allTasks);
    (0, ApprovalTestHelpers_1.verifyWithFileExtension)(tasksAsMarkdown + prettyHTML, 'html');
}
//# sourceMappingURL=RenderingTestHelpers.js.map