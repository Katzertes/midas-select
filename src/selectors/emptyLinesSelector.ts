import * as vscode from 'vscode';
import { Selector } from './selector';

/**
 * 連続する空行（空白やタブのみの行も含む）のブロック全体を選択するセレクター
 */
export class EmptyLinesSelector implements Selector {

    /**
     * 指定された行が空行（または空白文字のみ）であるかを判定します。
     * @param line 判定対象の行
     * @returns 空行であれば true
     */
    private isLineEmpty(line: vscode.TextLine): boolean {
        return line.text.trim().length === 0;
    }

    public canSelect(editor: vscode.TextEditor, selection: vscode.Selection): boolean {
        const line = editor.document.lineAt(selection.active.line);
        return this.isLineEmpty(line);
    }

    public select(editor: vscode.TextEditor, selection: vscode.Selection): vscode.Selection | null {
        if (!this.canSelect(editor, selection)) {
            return null;
        }

        const document = editor.document;
        const currentLineNumber = selection.active.line;
        
        let startLineNumber = currentLineNumber;
        let endLineNumber = currentLineNumber;

        // カーソル行から上に向かって、空行ブロックの開始位置を探す
        for (let i = currentLineNumber - 1; i >= 0; i--) {
            const line = document.lineAt(i);
            if (this.isLineEmpty(line)) {
                startLineNumber = i;
            } else {
                break; // 空行でない行が見つかった時点で終了
            }
        }

        // カーソル行から下に向かって、空行ブロックの終了位置を探す
        for (let i = currentLineNumber + 1; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            if (this.isLineEmpty(line)) {
                endLineNumber = i;
            } else {
                break; // 空行でない行が見つかった時点で終了
            }
        }
        
        // 選択範囲の開始位置と終了位置を決定
        const startPos = new vscode.Position(startLineNumber, 0);

        // 選択範囲の終端を、最後の空行の「次」の行の先頭に設定する
        // これにより、最後の空行も選択範囲に含まれ、カーソルは次の行の先頭に移動する
        const nextLineNumber = endLineNumber + 1;
        let endPos;

        // ファイルの最終行を超えないようにチェック
        if (nextLineNumber < document.lineCount) {
            endPos = new vscode.Position(nextLineNumber, 0);
        } else {
            // 空行ブロックがファイルの末尾にある場合は、最後の行の末尾まで選択
            const endLineContent = document.lineAt(endLineNumber);
            endPos = new vscode.Position(endLineNumber, endLineContent.range.end.character);
        }

        // 新しい選択範囲を作成します。アクティブなカーソル位置は選択範囲の終端になります。
        return new vscode.Selection(startPos, endPos);
    }
}

