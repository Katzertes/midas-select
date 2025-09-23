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

    /**
     * @param includeBrackets trueの場合、括弧自体も含めて選択します。
     */
    constructor(includeBrackets: boolean) {
        this.includeBrackets = includeBrackets;
    }

    public canSelect(editor: vscode.TextEditor, selection: vscode.Selection): boolean {
        return true;
    }

    public select(editor: vscode.TextEditor, selection: vscode.Selection): vscode.Selection | null {
        const document = editor.document;
        const text = document.getText();
        const cursorOffset = document.offsetAt(selection.active);

        let openBracketOffset = -1;
        let openBracketChar = '';

        for (let i = cursorOffset - 1; i >= 0; i--) {
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

        for (let i = openBracketOffset + 1; i < text.length; i++) {
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

            // 範囲が不正でないか確認
            if (startPos.isBefore(endPos)) {
                return new vscode.Selection(startPos, endPos);
            }
        }
        
        return null;
    }
}

