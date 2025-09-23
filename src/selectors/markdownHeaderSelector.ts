import * as vscode from 'vscode';
import { Selector } from './selector';

/**
 * Markdownの見出しセクションを選択するセレクター
 */
export class MarkdownHeaderSelector implements Selector {
    /**
     * 見出し行自体を選択範囲に含めるかどうか
     */
    private readonly includeHeader: boolean;

    /**
     * @param includeHeader trueの場合、見出し行を含めてセクション全体を選択します。
     * falseの場合、見出し行の次の行からセクションの終わりまでを選択します。
     */
    constructor(includeHeader: boolean) {
        this.includeHeader = includeHeader;
    }

    public canSelect(editor: vscode.TextEditor, selection: vscode.Selection): boolean {
        // .mdファイルでのみ動作
        return editor.document.languageId === 'markdown';
    }

    public select(editor: vscode.TextEditor, selection: vscode.Selection): vscode.Selection | null {
        return this.findHeaderSectionRange(editor, selection);
    }

    /**
     * カーソル位置の見出しセクションの範囲を探します。
     */
    private findHeaderSectionRange(editor: vscode.TextEditor, selection: vscode.Selection): vscode.Selection | null {
        const document = editor.document;
        const startLineNum = selection.active.line;
        const lineText = document.lineAt(startLineNum).text;

        const match = lineText.match(/^(#+)\s/);
        if (!match) {
            // カーソル行が見出しではない
            return null;
        }

        const headerLevel = match[1].length;
        let endLineNum = startLineNum;

        // 次の同じか、より上位レベルの見出しを探す
        for (let i = startLineNum + 1; i < document.lineCount; i++) {
            const nextLineText = document.lineAt(i).text;
            const nextMatch = nextLineText.match(/^(#+)\s/);

            if (nextMatch && nextMatch[1].length <= headerLevel) {
                // 次のセクションの開始点が見つかった
                endLineNum = i - 1;
                break;
            }
            endLineNum = i;
        }

        // 開始位置を決定
        let startPos: vscode.Position;
        if (this.includeHeader) {
            // 見出し行を含める場合
            startPos = document.lineAt(startLineNum).range.start;
        } else {
            // 見出し行を含めない場合
            // セクションが見出し行のみの場合は、何も選択しない
            if (startLineNum >= endLineNum) {
                return null;
            }
            startPos = document.lineAt(startLineNum + 1).range.start;
        }

        // 終了位置を決定（最後の行の改行文字も含む）
        let endPos: vscode.Position;
        if (endLineNum < document.lineCount - 1) {
            endPos = document.lineAt(endLineNum + 1).range.start;
        } else {
            endPos = document.lineAt(endLineNum).range.end;
        }

        // 開始位置が終了位置を越えていないか最終確認
        if (startPos.isAfter(endPos)) {
            return null;
        }

        return new vscode.Selection(startPos, endPos);
    }
}

