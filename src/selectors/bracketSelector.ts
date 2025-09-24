import * as vscode from 'vscode';
import { Selector } from './selector';

// --- 定数 ---
const BRACKET_PAIRS: [string, string][] = [
    ['(', ')'], ['[', ']'], ['{', '}'], ['<', '>'],
    ['「', '」'], ['『', '』'], ['（', '）'], ['〔', '〕'],
    ['【', '】'], ['〈', '〉'], ['《', '》'], ['«', '»'],
    ['［', '］'], ['｛', '｝'], ['＜', '＞']
];

const OPEN_TO_CLOSE_MAP: Map<string, string> = new Map(BRACKET_PAIRS);

export class BracketSelector implements Selector {
    private readonly includeBrackets: boolean;
    private readonly limitToParagraph: boolean;

    /**
     * @param includeBrackets trueの場合、括弧自体も含めて選択します。
     * @param limitToParagraph trueの場合、括弧の探索範囲を現在の段落に限定します。
     */
    constructor(includeBrackets: boolean, limitToParagraph: boolean) {
        this.includeBrackets = includeBrackets;
        this.limitToParagraph = limitToParagraph;
    }

    public canSelect(_editor: vscode.TextEditor, _selection: vscode.Selection): boolean {
        // canSelectは現在ロジックを持たないため、引数は未使用としてマーク
        return true;
    }

    public select(editor: vscode.TextEditor, selection: vscode.Selection): vscode.Selection | null {
        const document = editor.document;
        const text = document.getText();
        const cursorOffset = document.offsetAt(selection.active);
        const cursorLineNum = selection.active.line;

        // --- 探索範囲の決定 ---
        let searchStartOffset = 0;
        let searchEndOffset = text.length;

        if (this.limitToParagraph) {
            // 前方の空行を探す
            for (let i = cursorLineNum + 1; i < document.lineCount; i++) {
                if (document.lineAt(i).isEmptyOrWhitespace) {
                    searchEndOffset = document.offsetAt(document.lineAt(i).range.start);
                    break;
                }
            }
            // 後方の空行を探す
            for (let i = cursorLineNum - 1; i >= 0; i--) {
                if (document.lineAt(i).isEmptyOrWhitespace) {
                    searchStartOffset = document.offsetAt(document.lineAt(i).range.end);
                    break;
                }
            }
        }
        
        // --- 括弧の探索 ---
        let openBracketOffset = -1;
        let openBracketChar = '';

        for (let i = cursorOffset - 1; i >= searchStartOffset; i--) {
            const char = text[i];
            if (OPEN_TO_CLOSE_MAP.has(char)) {
                openBracketOffset = i;
                openBracketChar = char;
                break;
            }
        }
        
        if (openBracketOffset === -1) {
            return null;
        }

        const closeBracketChar = OPEN_TO_CLOSE_MAP.get(openBracketChar)!;
        let nestLevel = 1;
        let closeBracketOffset = -1;

        for (let i = openBracketOffset + 1; i < searchEndOffset; i++) {
            const char = text[i];
            if (char === openBracketChar) {
                nestLevel++;
            } else if (char === closeBracketChar) {
                nestLevel--;
                if (nestLevel === 0) {
                    closeBracketOffset = i;
                    break;
                }
            }
        }

        if (closeBracketOffset !== -1 && cursorOffset <= closeBracketOffset) {
            const startOffset = this.includeBrackets ? openBracketOffset : openBracketOffset + 1;
            const endOffset = this.includeBrackets ? closeBracketOffset + 1 : closeBracketOffset;
            
            const startPos = document.positionAt(startOffset);
            const endPos = document.positionAt(endOffset);

            if (startPos.isBefore(endPos)) {
                return new vscode.Selection(startPos, endPos);
            }
        }
        
        return null;
    }
}

