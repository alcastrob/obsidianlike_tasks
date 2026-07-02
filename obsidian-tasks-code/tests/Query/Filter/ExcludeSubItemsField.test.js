"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FilterTestHelpers_1 = require("../../TestingTools/FilterTestHelpers");
const TestHelpers_1 = require("../../TestingTools/TestHelpers");
const ExcludeSubItemsField_1 = require("../../../src/Query/Filter/ExcludeSubItemsField");
describe('sub-items', () => {
    it('exclude sub-items', () => {
        // Arrange
        const filter = new ExcludeSubItemsField_1.ExcludeSubItemsField().createFilterOrErrorMessage('exclude sub-items');
        // Assert
        (0, FilterTestHelpers_1.testTaskFilter)(filter, (0, TestHelpers_1.fromLine)({ line: '- [ ] Task' }), true);
        (0, FilterTestHelpers_1.testTaskFilter)(filter, (0, TestHelpers_1.fromLine)({ line: '  - [ ] Subtask1' }), false);
        (0, FilterTestHelpers_1.testTaskFilter)(filter, (0, TestHelpers_1.fromLine)({ line: '    - [ ] Subtask2' }), false);
    });
    it('subitem has more than one space after last > of blockquotes or callouts', () => {
        // Arrange
        const filter = new ExcludeSubItemsField_1.ExcludeSubItemsField().createFilterOrErrorMessage('exclude sub-items');
        // Assert
        (0, FilterTestHelpers_1.testTaskFilter)(filter, (0, TestHelpers_1.fromLine)({ line: '> - [ ] Task' }), true);
        (0, FilterTestHelpers_1.testTaskFilter)(filter, (0, TestHelpers_1.fromLine)({ line: '> > - [ ] Task' }), true);
        (0, FilterTestHelpers_1.testTaskFilter)(filter, (0, TestHelpers_1.fromLine)({ line: '>>  - [ ] Subtask1' }), false);
        (0, FilterTestHelpers_1.testTaskFilter)(filter, (0, TestHelpers_1.fromLine)({ line: '> >  - [ ] Subtask2' }), false);
    });
    it('should honour original case, when explaining simple filters', () => {
        const filter = new ExcludeSubItemsField_1.ExcludeSubItemsField().createFilterOrErrorMessage('EXCLUDE sub-items');
        expect(filter).toHaveExplanation('EXCLUDE sub-items');
    });
});
//# sourceMappingURL=ExcludeSubItemsField.test.js.map