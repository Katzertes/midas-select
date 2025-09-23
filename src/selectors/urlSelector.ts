import * as vscode from 'vscode';
import { Selector } from './selector';

// URLを検出するための、より堅牢な正規表現
// httpまたはhttpsで始まり、空白文字、<, >, " 以外が続く文字列にマッチします。
const URL_REGEX = /https?:\/\/[^\s<>"]+/gi;

export class UrlSelector implements Selector {
    public canSelect(editor: vscode.TextEditor, selection: vscode.Selection): boolean {
        return this.findUrlRange(editor, selection.active) !== null;
    }

    public select(editor: vscode.TextEditor, selection: vscode.Selection): vscode.Selection | null {
        const range = this.findUrlRange(editor, selection.active);
        if (range) {
            return new vscode.Selection(range.start, range.end);
        }
        return null;
    }

    /**
     * カーソル位置にあるURLの範囲を見つけます。
     * @param editor テキストエディタ
     * @param position カーソル位置
     * @returns URLの範囲。見つからなければ null
     */
    private findUrlRange(editor: vscode.TextEditor, position: vscode.Position): vscode.Range | null {
        const line = editor.document.lineAt(position.line);
        const lineText = line.text;
        const cursorCharPosition = position.character;

        let match;
        // グローバル正規表現(/g)はlastIndexをリセットする必要がある
        URL_REGEX.lastIndex = 0;

        // 行内で見つかったすべてのURL候補をチェックする
        while ((match = URL_REGEX.exec(lineText)) !== null) {
            const urlText = match[0];
            const startIndex = match.index;
            const endIndex = startIndex + urlText.length;

            // カーソルが、見つかったURLの範囲内にあるか確認
            if (cursorCharPosition >= startIndex && cursorCharPosition <= endIndex) {
                const startPos = new vscode.Position(position.line, startIndex);
                const endPos = new vscode.Position(position.line, endIndex);
                return new vscode.Range(startPos, endPos);
            }
        }

        return null; // カーソル位置にURLが見つからなかった
    }
}

