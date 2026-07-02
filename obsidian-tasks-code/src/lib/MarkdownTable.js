"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownTable = void 0;
class MarkdownTable {
    constructor(columnNames) {
        this._markdown = '';
        this.columnNames = columnNames;
        this.addTitleRow();
    }
    get markdown() {
        return this._markdown;
    }
    addTitleRow() {
        let titles = '|';
        let divider = '|';
        this.columnNames.forEach((s) => {
            titles += ` ${s} |`;
            divider += ' ----- |';
        });
        this._markdown += `${titles}\n`;
        this._markdown += `${divider}\n`;
    }
    addRow(cells) {
        const row = this.makeRowText(cells);
        this._markdown += `${row}\n`;
    }
    addRowIfNew(cells) {
        const row = this.makeRowText(cells);
        if (!this._markdown.includes(row)) {
            this._markdown += `${row}\n`;
        }
    }
    makeRowText(cells) {
        let row = '|';
        cells.forEach((s) => {
            row += ` ${s} |`;
        });
        return row;
    }
}
exports.MarkdownTable = MarkdownTable;
//# sourceMappingURL=MarkdownTable.js.map