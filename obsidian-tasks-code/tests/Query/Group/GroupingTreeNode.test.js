"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @jest-environment jsdom
 */
const GroupingTreeNode_1 = require("../../../src/Query/Group/GroupingTreeNode");
describe('Grouping Tree', () => {
    it('correctly generates all paths', () => {
        // Arrange
        // Build the following tree
        //              Root[1, 2, 3, 4, 5, 6]
        //             /                 \
        //        B[1, 5, 6]              C[3, 4, 5, 6]
        //          |                      /        \
        //        D[1]                  E[3, 4]       F[4, 5, 6]
        //                                            /        \
        //                                          G[4]       H[5, 6]
        const root = new GroupingTreeNode_1.GroupingTreeNode([1, 2, 3, 4, 5, 6]);
        const b = new GroupingTreeNode_1.GroupingTreeNode([1, 5, 6]);
        const c = new GroupingTreeNode_1.GroupingTreeNode([3, 4, 5, 6]);
        const d = new GroupingTreeNode_1.GroupingTreeNode([1]);
        const e = new GroupingTreeNode_1.GroupingTreeNode([3, 4]);
        const f = new GroupingTreeNode_1.GroupingTreeNode([4, 5, 6]);
        const g = new GroupingTreeNode_1.GroupingTreeNode([4]);
        const h = new GroupingTreeNode_1.GroupingTreeNode([5, 6]);
        root.children.set('B', b);
        root.children.set('C', c);
        b.children.set('D', d);
        c.children.set('E', e);
        c.children.set('F', f);
        f.children.set('G', g);
        f.children.set('H', h);
        // Act
        const allLeafs = root.generateAllPaths();
        // Assert
        const expected = new Map();
        expected.set(['B', 'D'], [1]);
        expected.set(['C', 'E'], [3, 4]);
        expected.set(['C', 'F', 'G'], [4]);
        expected.set(['C', 'F', 'H'], [5, 6]);
        expect(allLeafs).toEqual(expected);
    });
    it("generates correct map when the node doesn't have children", () => {
        // Arrange
        const root = new GroupingTreeNode_1.GroupingTreeNode([1, 2, 3, 4, 5, 6]);
        // Act
        const allLeafs = root.generateAllPaths();
        // Assert
        const expected = new Map();
        expected.set([], [1, 2, 3, 4, 5, 6]);
        expect(allLeafs).toEqual(expected);
    });
});
//# sourceMappingURL=GroupingTreeNode.test.js.map