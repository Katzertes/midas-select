import * as vscode from 'vscode';
import { Selector } from './selectors/selector';
import { UrlSelector } from './selectors/urlSelector';
import { MarkdownHeaderSelector } from './selectors/markdownHeaderSelector';
import { BracketSelector } from './selectors/bracketSelector';
import { IndentBlockSelector } from './selectors/indentBlockSelector';
import { EmptyLinesSelector } from './selectors/emptyLinesSelector';
import { ParagraphSelector } from './selectors/paragraphSelector';

// 合意した、正しい優先順位に基づいたセレクターの一覧
const SELECTORS: Selector[] = [
    new UrlSelector(),
    new MarkdownHeaderSelector(true),
    new MarkdownHeaderSelector(false),
    new BracketSelector(false, true), // 1. 括弧の内側 (段落スコープ)
    new BracketSelector(true, true),  // 2. 括弧全体 (段落スコープ)
    new IndentBlockSelector(),
    new ParagraphSelector(false),      // 3. 段落全体
    new ParagraphSelector(true),     // 4. カーソルから段落末尾
    new EmptyLinesSelector(),
    new BracketSelector(false, false),// 5. 括弧の内側 (ファイルスコープ)
    new BracketSelector(true, false), // 6. 括弧全体 (ファイルスコープ)
];

// 正しい順序に合わせた設定キーのマッピング
const SELECTOR_INDEX_TO_CONFIG_KEY: { [key: number]: string } = {
    0: 'url',
    1: 'markdownHeader',
    2: 'markdownContent',
    3: 'bracketInParagraph',
    4: 'bracketWithSymbolsInParagraph',
    5: 'indentBlock',
    6: 'paragraph',
    7: 'paragraphForward',
    8: 'emptyLines',
    9: 'bracket',
    10: 'bracketWithSymbols'
};

// 最後に成功した選択の状態
let lastExecutionState: {
    uri: string;
    initialSelections: readonly vscode.Selection[];
    resultingSelections: readonly vscode.Selection[];
    lastSelectorIndex: number;
} | undefined;


export function activate(context: vscode.ExtensionContext) {

    const disposable = vscode.commands.registerCommand('midas-select.select', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const documentUri = editor.document.uri.toString();
        const currentSelections = editor.selections;
        
        let initialSelectionsForThisRun = currentSelections;
        let startingSelectorIndex = 0;

        if (
            lastExecutionState &&
            lastExecutionState.uri === documentUri &&
            areSelectionsEqual(lastExecutionState.resultingSelections, currentSelections)
        ) {
            initialSelectionsForThisRun = lastExecutionState.initialSelections;
            startingSelectorIndex = lastExecutionState.lastSelectorIndex + 1;
        }

        let newSelections: vscode.Selection[] | null = null;
        let successfulSelectorIndex = -1;
        
        for (let i = 0; i < SELECTORS.length; i++) {
            const selectorIndex = (startingSelectorIndex + i) % SELECTORS.length;
            const selector = SELECTORS[selectorIndex];
            const potentialSelections = initialSelectionsForThisRun.map(s => selector.select(editor, s) || s);

            if (!areSelectionsEqual(initialSelectionsForThisRun, potentialSelections)) {
                newSelections = potentialSelections;
                successfulSelectorIndex = selectorIndex;
                break;
            }
        }

        if (newSelections) {
            editor.selections = newSelections;
            lastExecutionState = {
                uri: documentUri,
                initialSelections: initialSelectionsForThisRun,
                resultingSelections: newSelections,
                lastSelectorIndex: successfulSelectorIndex
            };
            executeAfterSelectAction(successfulSelectorIndex);
        } else {
            executeAfterSelectAction(-1);
            lastExecutionState = undefined;
        }
    });

    context.subscriptions.push(disposable);
}

function executeAfterSelectAction(selectorIndex: number) {
    const config = vscode.workspace.getConfiguration('midas-select.afterSelect');
    const actionKey = selectorIndex === -1 
        ? 'noSelection' 
        : SELECTOR_INDEX_TO_CONFIG_KEY[selectorIndex];

    if (!actionKey) return; // 安全策
    
    const action = config.get<string>(actionKey);

    switch (action) {
        case 'copy':
            vscode.commands.executeCommand('editor.action.clipboardCopyAction');
            break;
        case 'cut':
            vscode.commands.executeCommand('editor.action.clipboardCutAction');
            break;
        case 'paste':
            vscode.commands.executeCommand('editor.action.clipboardPasteAction');
            break;
        case 'delete':
            vscode.commands.executeCommand('deleteRight');
            break;
        case 'apply-comment':
            vscode.commands.executeCommand('editor.action.toggleLineComment');
            break;
        case 'format':
            vscode.commands.executeCommand('editor.action.formatSelection');
            break;
        default:
            break;
    }

    const mutatingActions = ['cut', 'paste', 'delete', 'apply-comment', 'format'];
    if (action && mutatingActions.includes(action)) {
        lastExecutionState = undefined;
    }
}

export function deactivate() {
    lastExecutionState = undefined;
}

function areSelectionsEqual(a: readonly vscode.Selection[], b: readonly vscode.Selection[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (!a[i].isEqual(b[i])) return false;
    }
    return true;
}

