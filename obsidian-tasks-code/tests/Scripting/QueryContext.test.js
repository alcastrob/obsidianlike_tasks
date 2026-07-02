"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TaskBuilder_1 = require("../TestingTools/TaskBuilder");
const FilenameField_1 = require("../../src/Query/Filter/FilenameField");
const FolderField_1 = require("../../src/Query/Filter/FolderField");
const PathField_1 = require("../../src/Query/Filter/PathField");
const RootField_1 = require("../../src/Query/Filter/RootField");
const QueryContext_1 = require("../../src/Scripting/QueryContext");
const FunctionField_1 = require("../../src/Query/Filter/FunctionField");
const SearchInfo_1 = require("../../src/Query/SearchInfo");
const TasksFileHelpers_1 = require("../TestingTools/TasksFileHelpers");
const tasksFile = (0, TasksFileHelpers_1.createTestTasksFile)('a/b/c.md');
const task = new TaskBuilder_1.TaskBuilder().path(tasksFile.path).build();
const queryContext = (0, QueryContext_1.makeQueryContext)(tasksFile);
describe('QueryContext', () => {
    describe('values should all match their corresponding filters', () => {
        it('query.file.root', () => {
            const instruction = `root includes ${queryContext.query.file.root}`;
            const filter = new RootField_1.RootField().createFilterOrErrorMessage(instruction);
            expect(filter).toMatchTask(task);
        });
        it('query.file.path', () => {
            const instruction = `path includes ${queryContext.query.file.path}`;
            const filter = new PathField_1.PathField().createFilterOrErrorMessage(instruction);
            expect(filter).toMatchTask(task);
        });
        it('query.file.folder', () => {
            const instruction = `folder includes ${queryContext.query.file.folder}`;
            const filter = new FolderField_1.FolderField().createFilterOrErrorMessage(instruction);
            expect(filter).toMatchTask(task);
        });
        it('query.file.filename', () => {
            const instruction = `filename includes ${queryContext.query.file.filename}`;
            const filter = new FilenameField_1.FilenameField().createFilterOrErrorMessage(instruction);
            expect(filter).toMatchTask(task);
        });
    });
    describe('non-file properties', () => {
        it('query.allTasks', () => {
            // Arrange
            // An artificial example, just to demonstrate that query.allTasks is accessible via scripting,
            // when the SearchInfo parameter is converted to a QueryContext.
            const instruction = 'group by function query.allTasks.length';
            const grouper = new FunctionField_1.FunctionField().createGrouperFromLine(instruction);
            expect(grouper).not.toBeNull();
            const searchInfo = new SearchInfo_1.SearchInfo(tasksFile, [task]);
            // Act
            const group = grouper.grouper(task, searchInfo);
            // Assert
            expect(group).toEqual(['1']);
        });
        it('query.searchCache should be empty initially', () => {
            // Arrange
            const searchInfo = new SearchInfo_1.SearchInfo(tasksFile, [task]);
            const queryContext = searchInfo.queryContext();
            expect(queryContext?.query?.searchCache).toEqual({});
        });
        it('query.searchCache should cache a value', () => {
            // Arrange
            const searchInfo = new SearchInfo_1.SearchInfo(tasksFile, [task]);
            const queryContext = searchInfo.queryContext();
            expect(queryContext).not.toBeNull();
            const cacheKey = 'function1';
            // Act
            queryContext.query.searchCache[cacheKey] = 1;
            // Assert
            expect(queryContext.query.searchCache[cacheKey]).toEqual(1);
        });
    });
});
//# sourceMappingURL=QueryContext.test.js.map