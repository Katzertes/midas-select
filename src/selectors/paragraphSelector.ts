import * as vscode from 'vscode';
import { Selector } from './selector';

/**
 * 段落（空行で区切られたテキストブロック）を選択するセレクター
 */
export class ParagraphSelector implements Selector {
    private readonly fromCursorForwardOnly: boolean;

    /**
     * @param fromCursorForwardOnly trueの場合、カーソル行から段落の末尾までを選択します。
     * falseの場合、段落全体を選択します。
     */
    constructor(fromCursorForwardOnly: boolean) {
        this.fromCursorForwardOnly = fromCursorForwardOnly;
    }

    public canSelect(editor: vscode.TextEditor, selection: vscode.Selection): boolean {
        return true;
    }

    public select(editor: vscode.TextEditor, selection: vscode.Selection): vscode.Selection | null {
        const document = editor.document;
        const cursorLineNum = selection.active.line;

        if (document.lineAt(cursorLineNum).isEmptyOrWhitespace) {
            return null; // カーソル行が空行ならEmptyLinesSelectorへ
        }
        
        let firstLine = cursorLineNum;
        if (!this.fromCursorForwardOnly) {
            // モードがfalseの場合のみ、上方に検索
            for (let i = cursorLineNum - 1; i >= 0; i--) {
                if (document.lineAt(i).isEmptyOrWhitespace) {
                    break;
                }
                firstLine = i;
            }
        }

        let lastLine = cursorLineNum;
        for (let i = cursorLineNum + 1; i < document.lineCount; i++) {
            if (document.lineAt(i).isEmptyOrWhitespace) {
                break;
            }
            lastLine = i;
        }

        const startPos = document.lineAt(firstLine).range.start;
        const endPos = document.lineAt(lastLine).range.end;
        return new vscode.Selection(startPos, endPos);
    }
}

