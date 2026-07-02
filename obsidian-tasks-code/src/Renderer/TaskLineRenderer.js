"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskLineRenderer = void 0;
exports.createAndAppendElement = createAndAppendElement;
exports.reconcileReplacementTask = reconcileReplacementTask;
const obsidian_1 = require("obsidian");
const GlobalFilter_1 = require("../Config/GlobalFilter");
const Settings_1 = require("../Config/Settings");
const Postponer_1 = require("../DateTime/Postponer");
const TaskLayoutOptions_1 = require("../Layout/TaskLayoutOptions");
const File_1 = require("../Obsidian/File");
const StatusRegistry_1 = require("../Statuses/StatusRegistry");
const Task_1 = require("../Task/Task");
const TaskRegularExpressions_1 = require("../Task/TaskRegularExpressions");
const DateMenu_1 = require("../ui/Menus/DateMenu");
const DatePicker_1 = require("../ui/Menus/DatePicker");
const StatusMenu_1 = require("../ui/Menus/StatusMenu");
const TaskEditingMenu_1 = require("../ui/Menus/TaskEditingMenu");
const TaskFieldRenderer_1 = require("./TaskFieldRenderer");
/**
 * Create an HTML element, and append it to a parent element.
 *
 * Unlike the equivalent Obsidian convenience function li.createEl(),
 * this can be called from our automated tests.
 *
 * @param tagName - the type of element to be created, for example 'ul', 'div', 'span', 'li'.
 * @param parentElement - the parent element, to which the created element will be appended.
 *
 * @example <caption>Example call:</caption>
 * const li = createAndAppendElement('li', parentElement);
 */
function createAndAppendElement(tagName, parentElement) {
    // Maintenance note:
    //  We don't use the Obsidian convenience function li.createEl() here, because we don't have it available
    //  when running tests, and we want the tests to be able to create the full div and span structure,
    //  so had to convert all of these to the equivalent but more elaborate document.createElement() and
    //  appendChild() calls.
    const el = document.createElement(tagName);
    parentElement.appendChild(el);
    return el;
}
/**
 * Replace the original list item that Obsidian rendered in Reading View with the one
 * that Tasks has rendered.
 *
 * Any classes and data attributes added to the original element by Obsidian or other plugins'
 * Markdown post-processors prior to this plugin's Markdown post-processor running are copied onto
 * the replacement so that they are not lost when Tasks swaps in its own rendered element.
 *
 * Data attributes that the replacement already has (those that Tasks set when rendering) take
 * precedence and are not overwritten by the original's values.
 *
 * @param original - the list item rendered by Obsidian, which is being replaced.
 * @param replacement - the list item rendered by Tasks, which takes its place.
 */
function reconcileReplacementTask(original, replacement) {
    original.classList.forEach((cls) => replacement.classList.add(cls)); // Copy classes from original to replacement
    // Copy data attributes from original to replacement, without overwriting those Tasks has set
    original.getAttributeNames().forEach((name) => {
        if (name.startsWith('data-') && !replacement.hasAttribute(name)) {
            replacement.setAttribute(name, original.getAttribute(name));
        }
    });
    original.replaceWith(replacement);
}
/**
 * `TaskLineRenderer` is responsible for rendering task details as HTML list items with
 * various customization options.
 *
 * It integrates with Obsidian's rendering system and includes functionalities such as priority,
 * due dates, and user interactions.
 *
 * Individual fields in {@link Task} are rendered by {@link TaskFieldRenderer}.
 */
class TaskLineRenderer {
    static async obsidianMarkdownRenderer(app, text, element, path, obsidianComponent) {
        if (!obsidianComponent) {
            return;
        }
        await obsidian_1.MarkdownRenderer.render(app, text, element, path, obsidianComponent);
    }
    /**
     * Builds a renderer for tasks with various options.
     *
     * @param textRenderer The optional renderer to be used. Skip this parameter for Obsidian rendering.
     * For test purposes mock renderers shall be used.
     *
     * @param obsidianComponent One of the parameters needed by `MarkdownRenderer.renderMarkdown()` Obsidian API,
     * that is called by the Obsidian renderer. Set this to null in test code.
     *
     * @param taskLayoutOptions See {@link TaskLayoutOptions}.
     *
     * @param queryLayoutOptions See {@link QueryLayoutOptions}.
     */
    constructor({ textRenderer = TaskLineRenderer.obsidianMarkdownRenderer, obsidianApp, obsidianComponent, taskLayoutOptions, queryLayoutOptions, }) {
        this.textRenderer = textRenderer;
        this.obsidianApp = obsidianApp;
        this.obsidianComponent = obsidianComponent;
        this.taskLayoutOptions = taskLayoutOptions;
        this.queryLayoutOptions = queryLayoutOptions;
    }
    /**
     * Renders a given Task object into an HTML List Item (LI) element.
     *
     * The element includes the task and its various components (description, priority, block link etc.), the
     * checkbox on the left with its event handling of completing the task, and the button for editing the task.
     *
     * @returns an HTML rendered List Item element (LI) for a task.
     * @note Output is based on the {@link DefaultTaskSerializer}'s format, with default (emoji) symbols
     * @param li HTML element for the rendered task.
     * @param task The task to be rendered.
     * @param taskIndex Task's index in the list. This affects `data-line` data attributes of the list item.
     * @param isTaskInQueryFile
     * @param isFilenameUnique Whether the name of the file that contains the task is unique in the vault.
     *                         If it is undefined, the outcome will be the same as with a unique file name:
     *                         the file name only. If set to `true`, the full path will be returned.
     */
    async renderTaskLine({ li, task, taskIndex, isTaskInQueryFile, isFilenameUnique, }) {
        li.classList.add('task-list-item', 'plugin-tasks-list-item');
        const textSpan = createAndAppendElement('span', li);
        textSpan.classList.add('tasks-list-text');
        await this.taskToHtml(task, textSpan, li, isTaskInQueryFile);
        // NOTE: this area is mentioned in `CONTRIBUTING.md` under "How does Tasks handle status changes". When
        // moving the code, remember to update that reference too.
        const checkbox = createAndAppendElement('input', li);
        checkbox.classList.add('task-list-item-checkbox');
        checkbox.type = 'checkbox';
        if (task.status.symbol !== ' ') {
            checkbox.checked = true;
            li.classList.add('is-checked');
        }
        // If we don't have a path, the task is likely to be in a card on a canvas file,
        // and we cannot save any edits, so there is no point listening for any events on the task.
        // See https://github.com/obsidian-tasks-group/obsidian-tasks/issues/2130
        const addEventListeners = task.taskLocation.hasKnownPath;
        if (addEventListeners) {
            checkbox.addEventListener('click', async (event) => {
                event.preventDefault();
                // It is required to stop propagation so that obsidian won't write the file with the
                // checkbox (un)checked. Obsidian would write after us and overwrite our change.
                event.stopPropagation();
                // Should be re-rendered as enabled after update in file.
                checkbox.disabled = true;
                const toggledTasks = task.toggleWithRecurrenceInUsersOrder();
                await (0, File_1.replaceTaskWithTasks)({
                    originalTask: task,
                    newTasks: toggledTasks,
                });
            });
            checkbox.addEventListener('contextmenu', (ev) => {
                (0, TaskEditingMenu_1.showMenu)(ev, new StatusMenu_1.StatusMenu(StatusRegistry_1.StatusRegistry.getInstance(), task));
            });
            checkbox.setAttribute('title', 'Right-click for options');
        }
        li.prepend(checkbox);
        // Set these to be compatible with stock obsidian lists:
        li.setAttribute('data-task', task.status.symbol.trim()); // Trim to ensure empty attribute for space. Same way as obsidian.
        li.setAttribute('data-line', taskIndex.toString());
        li.setAttribute('data-task-status-name', task.status.name);
        li.setAttribute('data-task-status-type', task.status.type);
        checkbox.setAttribute('data-line', taskIndex.toString());
        if (this.queryLayoutOptions.shortMode) {
            this.addTooltip(task, textSpan, isFilenameUnique);
        }
    }
    async taskToHtml(task, parentElement, li, isTaskInQueryFile) {
        const fieldRenderer = new TaskFieldRenderer_1.TaskFieldRenderer();
        const emojiSerializer = Settings_1.TASK_FORMATS.tasksPluginEmoji.taskSerializer;
        // Render and build classes for all the task's visible components
        for (const component of this.taskLayoutOptions.shownComponents) {
            const componentString = emojiSerializer.componentToString(task, this.queryLayoutOptions.shortMode, component);
            if (componentString) {
                // Create the text span that will hold the rendered component
                const span = createAndAppendElement('span', parentElement);
                // Inside that text span, we are creating another internal span, that will hold the text itself.
                // This may seem redundant, and by default it indeed does nothing, but we do it to allow the CSS
                // to differentiate between the container of the text and the text itself, so it will be possible
                // to do things like surrounding only the text (rather than its whole placeholder) with a highlight
                const internalSpan = createAndAppendElement('span', span);
                await this.renderComponentText(internalSpan, componentString, component, task, isTaskInQueryFile);
                this.addInternalClasses(component, internalSpan);
                // Add the component's CSS class describing what this component is (priority, due date etc.)
                fieldRenderer.addClassName(span, component);
                // Add the component's attribute ('priority-medium', 'due-past-1d' etc.)
                fieldRenderer.addDataAttribute(span, task, component);
                fieldRenderer.addDataAttribute(li, task, component);
                if (Task_1.Task.allDateFields().includes(component)) {
                    const componentDateField = component;
                    // Note: The more convenient span.onClickEvent() doesn't work here, as it is not available when tests are run.
                    span.addEventListener('click', (ev) => {
                        ev.preventDefault(); // suppress the default click behavior
                        ev.stopPropagation(); // suppress further event propagation
                        (0, DatePicker_1.promptForDate)(span, task, componentDateField, TaskEditingMenu_1.defaultTaskSaver);
                    });
                    span.addEventListener('contextmenu', (ev) => {
                        (0, TaskEditingMenu_1.showMenu)(ev, new DateMenu_1.DateMenu(componentDateField, task, TaskEditingMenu_1.defaultTaskSaver));
                    });
                    span.setAttribute('title', `Click to edit ${(0, Postponer_1.splitDateText)(componentDateField)}, Right-click for more options`);
                }
            }
        }
        // Now build classes for the hidden task components without rendering them
        for (const component of this.taskLayoutOptions.hiddenComponents) {
            fieldRenderer.addDataAttribute(li, task, component);
        }
        // If a task has no priority field set, its priority will not be rendered as part of the loop above, and
        // it will not be set a priority data attribute.
        // In such a case we want the upper task LI element to mark the task has a 'normal' priority.
        // So if the priority was not rendered, force it through the pipe of getting the component data for the
        // priority field.
        if (li.dataset.taskPriority === undefined) {
            fieldRenderer.addDataAttribute(li, task, TaskLayoutOptions_1.TaskLayoutComponent.Priority);
        }
    }
    /*
     * Renders the given component into the given HTML span element.
     */
    async renderComponentText(span, componentString, component, task, isTaskInQueryFile) {
        if (component === TaskLayoutOptions_1.TaskLayoutComponent.Description) {
            return await this.renderDescription(task, span, isTaskInQueryFile);
        }
        span.textContent = componentString;
    }
    async renderDescription(task, span, isTaskInQueryFile) {
        let description = this.adjustRelativeLinksInDescription(task, isTaskInQueryFile);
        description = GlobalFilter_1.GlobalFilter.getInstance().removeAsWordFromDependingOnSettings(description);
        const { debugSettings } = (0, Settings_1.getSettings)();
        if (debugSettings.showTaskHiddenData) {
            // Add some debug output to enable hidden information in the task to be inspected.
            description += `<br>🐛 <b>${task.lineNumber}</b> . ${task.sectionStart} . ${task.sectionIndex} . '<code>${task.originalMarkdown}</code>'<br>'<code>${task.path}</code>' > '<code>${task.precedingHeader}</code>'<br>`;
        }
        await this.textRenderer(this.obsidianApp, description, span, task.path, this.obsidianComponent);
        // If the task is a block quote, the block quote wraps the p-tag that contains the content.
        // In that case, we need to unwrap the p-tag *inside* the surrounding block quote.
        // Otherwise, we unwrap the p-tag as a direct descendant of the span.
        const blockQuote = span.querySelector('blockquote');
        const directParentOfPTag = blockQuote ?? span;
        // Unwrap the p-tag that was created by the MarkdownRenderer:
        const pElement = directParentOfPTag.querySelector('p');
        if (pElement !== null) {
            while (pElement.firstChild) {
                directParentOfPTag.insertBefore(pElement.firstChild, pElement);
            }
            pElement.remove();
        }
        // Remove an empty trailing p-tag that the MarkdownRenderer appends when there is a block link:
        span.querySelectorAll('p').forEach((pElement) => {
            if (!pElement.hasChildNodes()) {
                pElement.remove();
            }
        });
        // Remove the footnote that the MarkdownRenderer appends when there is a footnote in the task:
        span.querySelectorAll('.footnotes').forEach((footnoteElement) => {
            footnoteElement.remove();
        });
    }
    adjustRelativeLinksInDescription(task, isTaskInQueryFile) {
        // Skip if task is from the same file as the query
        if (isTaskInQueryFile) {
            return task.description;
        }
        // Skip if the task is in a file with no links
        const linkCache = task.file.cachedMetadata.links;
        if (!linkCache) {
            return task.description;
        }
        // Find links in the task description
        const taskLinks = linkCache.filter((link) => {
            return (link.position.start.line === task.taskLocation.lineNumber &&
                task.description.includes(link.original) &&
                link.link.startsWith('#'));
        });
        let description = task.description;
        if (taskLinks.length !== 0) {
            // a task can only be from one file, so we can replace all the internal links
            //in the description with the new file path
            for (const link of taskLinks) {
                const fullLink = `[[${task.path}${link.link}|${link.displayText}]]`;
                // Replace the first instance of this link:
                description = description.replace(link.original, fullLink);
            }
        }
        return description;
    }
    /*
     * Adds internal classes for various components (right now just tags actually), meaning that we modify the existing
     * rendered element to add classes inside it.
     * In the case of tags, Obsidian renders a Markdown description with <a class="tag"> elements for tags. We want to
     * enable users to style these, so we modify the rendered Markdown by adding the specific tag classes for these <a>
     * elements.
     */
    addInternalClasses(component, internalSpan) {
        /*
         * Sanitize tag names, so they will be valid attribute values according to the HTML spec:
         * https://html.spec.whatwg.org/multipage/parsing.html#attribute-value-(double-quoted)-state
         */
        function tagToAttributeValue(tag) {
            // eslint-disable-next-line no-control-regex
            const illegalChars = /["&\x00\r\n]/g;
            let sanitizedTag = tag.replace(illegalChars, '-');
            // And if after sanitization the name starts with dashes or underscores, remove them.
            sanitizedTag = sanitizedTag.replace(/^[-_]+/, '');
            if (sanitizedTag.length > 0)
                return sanitizedTag;
            else
                return null;
        }
        if (component === TaskLayoutOptions_1.TaskLayoutComponent.Description) {
            const tags = internalSpan.getElementsByClassName('tag');
            for (let i = 0; i < tags.length; i++) {
                const tagName = tags[i].textContent;
                if (tagName) {
                    const className = tagToAttributeValue(tagName);
                    const element = tags[i];
                    if (className)
                        element.dataset.tagName = className;
                }
            }
        }
    }
    addTooltip(task, element, isFilenameUnique) {
        // NEW_TASK_FIELD_EDIT_REQUIRED
        const { recurrenceSymbol, startDateSymbol, createdDateSymbol, scheduledDateSymbol, dueDateSymbol, cancelledDateSymbol, doneDateSymbol, } = Settings_1.TASK_FORMATS.tasksPluginEmoji.taskSerializer.symbols;
        element.addEventListener('mouseenter', () => {
            function addDateToTooltip(tooltip, date, signifier) {
                if (date) {
                    const createdDateDiv = tooltip.createDiv();
                    createdDateDiv.setText(toTooltipDate({
                        signifier: signifier,
                        date: date,
                    }));
                }
            }
            function toTooltipDate({ signifier, date }) {
                return `${signifier} ${date.format(TaskRegularExpressions_1.TaskRegularExpressions.dateFormat)} (${date.from(window.moment().startOf('day'))})`;
            }
            const tooltip = element.createDiv();
            tooltip.addClasses(['tooltip', 'pop-up']);
            // NEW_TASK_FIELD_EDIT_REQUIRED
            if (task.recurrence) {
                const recurrenceDiv = tooltip.createDiv();
                recurrenceDiv.setText(`${recurrenceSymbol} ${task.recurrence.toText()}`);
            }
            addDateToTooltip(tooltip, task.createdDate, createdDateSymbol);
            addDateToTooltip(tooltip, task.startDate, startDateSymbol);
            addDateToTooltip(tooltip, task.scheduledDate, scheduledDateSymbol);
            addDateToTooltip(tooltip, task.dueDate, dueDateSymbol);
            addDateToTooltip(tooltip, task.cancelledDate, cancelledDateSymbol);
            addDateToTooltip(tooltip, task.doneDate, doneDateSymbol);
            const linkText = task.getLinkText({ isFilenameUnique });
            if (linkText) {
                const backlinkDiv = tooltip.createDiv();
                backlinkDiv.setText(`🔗 ${linkText}`);
            }
            element.addEventListener('mouseleave', () => {
                tooltip.remove();
            });
        });
    }
    async renderListItem(li, listItem, listItemIndex) {
        if (listItem.statusCharacter) {
            // special case: handle toggling of task lines without the global query, in Tasks search results
            const checkbox = createAndAppendElement('input', li);
            checkbox.classList.add('task-list-item-checkbox');
            checkbox.type = 'checkbox';
            checkbox.addEventListener('click', async (event) => {
                event.preventDefault();
                // It is required to stop propagation so that obsidian won't write the file with the
                // checkbox (un)checked. Obsidian would write after us and overwrite our change.
                event.stopPropagation();
                // Should be re-rendered as enabled after update in file.
                checkbox.disabled = true;
                const checkedOrUncheckedListItem = listItem.checkOrUncheck();
                await (0, File_1.replaceTaskWithTasks)({ originalTask: listItem, newTasks: checkedOrUncheckedListItem });
            });
            if (listItem.statusCharacter !== ' ') {
                checkbox.checked = true;
                li.classList.add('is-checked');
            }
            li.classList.add('task-list-item');
            // Set these to be compatible with stock obsidian lists:
            li.setAttribute('data-task', listItem.statusCharacter.trim());
            // Trim to ensure empty attribute for space. Same way as obsidian.
            li.setAttribute('data-line', listItemIndex.toString());
        }
        const span = createAndAppendElement('span', li);
        await this.textRenderer(this.obsidianApp, listItem.description, span, listItem.findClosestParentTask()?.path ?? '', this.obsidianComponent);
        // Unwrap the p-tag that was created by the MarkdownRenderer:
        const pElement = span.querySelector('p');
        if (pElement !== null) {
            while (pElement.firstChild) {
                span.insertBefore(pElement.firstChild, pElement);
            }
            pElement.remove();
        }
        return li;
    }
}
exports.TaskLineRenderer = TaskLineRenderer;
//# sourceMappingURL=TaskLineRenderer.js.map