import * as vscode from 'vscode';
import { Selector } from './selector';

/**
 * 同じインデントが続くブロックを選択するセレクター
 * 2種類のインデントを順に評価します:
 * 1. 空白インデント: 行頭の空白文字が完全に一致する行のブロック。
 * 2. 記号インデント: 空白インデントがない行で、共通の記号接頭辞を持つ行のブロック。
 */
export class IndentBlockSelector implements Selector {

    public canSelect(editor: vscode.TextEditor, selection: vscode.Selection): boolean {
        // selectメソッドで実際の選択を試みるため、常にtrueを返す
        return true;
    }

    public select(editor: vscode.TextEditor, selection: vscode.Selection): vscode.Selection | null {
        const document = editor.document;
        const cursorLineNum = selection.active.line;
        const cursorLine = document.lineAt(cursorLineNum);

        if (cursorLine.isEmptyOrWhitespace) {
            return null; // 空行はEmptyLinesSelectorへ
        }

        // --- プライオリティ1: 空白文字によるインデントブロック ---
        const whitespaceIndent = cursorLine.text.substring(0, cursorLine.firstNonWhitespaceCharacterIndex);
        if (whitespaceIndent.length > 0) {
            let firstLine = cursorLineNum;
            for (let i = cursorLineNum - 1; i >= 0; i--) {
                const line = document.lineAt(i);
                if (line.isEmptyOrWhitespace) break;
                const lineIndent = line.text.substring(0, line.firstNonWhitespaceCharacterIndex);
                if (lineIndent === whitespaceIndent) {
                    firstLine = i;
                } else {
                    break;
                }
            }

            let lastLine = cursorLineNum;
            for (let i = cursorLineNum + 1; i < document.lineCount; i++) {
                const line = document.lineAt(i);
                if (line.isEmptyOrWhitespace) break;
                const lineIndent = line.text.substring(0, line.firstNonWhitespaceCharacterIndex);
                if (lineIndent === whitespaceIndent) {
                    lastLine = i;
                } else {
                    break;
                }
            }
            // 意図的にインデントされた行は、たとえ1行でもブロックとして成立させる
            const startPos = document.lineAt(firstLine).range.start;
            const endPos = document.lineAt(lastLine).range.end;
            return new vscode.Selection(startPos, endPos);
        }


        // --- プライオリティ2: 記号によるインデントブロック ---
        const symbolIndent = this.determineSymbolIndent(document, cursorLineNum);
        if (symbolIndent) {
            let firstLine = cursorLineNum;
            for (let i = cursorLineNum - 1; i >= 0; i--) {
                if (document.lineAt(i).text.startsWith(symbolIndent)) {
                    firstLine = i;
                } else {
                    break;
                }
            }
    
            let lastLine = cursorLineNum;
            for (let i = cursorLineNum + 1; i < document.lineCount; i++) {
                if (document.lineAt(i).text.startsWith(symbolIndent)) {
                    lastLine = i;
                } else {
                    break;
                }
            }
            
            // 記号インデントブロックは2行以上でなければならない
            if (firstLine !== lastLine) {
                const startPos = document.lineAt(firstLine).range.start;
                const endPos = document.lineAt(lastLine).range.end;
                return new vscode.Selection(startPos, endPos);
            }
        }

        return null;
    }

    /**
     * カーソル行が属する「記号インデント」を特定します。
     * @returns インデント文字列。なければnull。
     */
    private determineSymbolIndent(document: vscode.TextDocument, cursorLineNum: number): string | null {
        const lineText = document.lineAt(cursorLineNum).text;
        const lineAbove = cursorLineNum > 0 ? document.lineAt(cursorLineNum - 1) : null;
        const lineBelow = cursorLineNum < document.lineCount - 1 ? document.lineAt(cursorLineNum + 1) : null;

        const prefixAbove = lineAbove ? this.getCommonPrefix(lineText, lineAbove.text) : "";
        const prefixBelow = lineBelow ? this.getCommonPrefix(lineText, lineBelow.text) : "";

        const indentCandidate = prefixAbove.length >= prefixBelow.length ? prefixAbove : prefixBelow;

        // 候補が空でなく、かつ英数字を含まない（記号や句読点のみである）ことを確認
        if (indentCandidate.length > 0 && !/[a-zA-Z0-9]/.test(indentCandidate)) {
            return indentCandidate;
        }

        return null;
    }

    /**
     * 2つの文字列の共通の接頭辞を取得します。
     */
    private getCommonPrefix(str1: string, str2: string): string {
        let i = 0;
        if (!str1 || !str2) return "";
        
        while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
            i++;
        }
        return str1.substring(0, i);
    }
}

