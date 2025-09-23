// 2025.09.23 21:10

import * as vscode from 'vscode';
import { Selector } from './selectors/selector';
import { UrlSelector } from './selectors/urlSelector';
import { MarkdownHeaderSelector } from './selectors/markdownHeaderSelector';
import { BracketSelector } from './selectors/bracketSelector';
import { IndentBlockSelector } from './selectors/indentBlockSelector';
import { EmptyLinesSelector } from './selectors/emptyLinesSelector';
import { ParagraphSelector } from './selectors/paragraphSelector';

// セレクターの一覧（優先順位順）
const SELECTORS: Selector[] = [
    new UrlSelector(),
    new MarkdownHeaderSelector(true),
    new MarkdownHeaderSelector(false),
    new BracketSelector(false),
    new BracketSelector(true),
    new IndentBlockSelector(),
    new EmptyLinesSelector(),
    new ParagraphSelector(false),
    new ParagraphSelector(true),
];

// セレクターのインデックスと設定キーのマッピング
const SELECTOR_INDEX_TO_CONFIG_KEY: { [key: number]: string } = {
    0: 'url',
    1: 'markdownHeader',
    2: 'markdownContent',
    3: 'bracket',
    4: 'bracketWithSymbols',
    5: 'indentBlock',
    6: 'emptyLines',
    7: 'paragraph',
    8: 'paragraphForward'
};

// 最後に成功した選択の状態
let lastExecutionState: {
    uri: string;
    initialSelections: readonly vscode.Selection[];
    resultingSelections: readonly vscode.Selection[];
    lastSelectorIndex: number;
} | undefined;


export function activate(context: vscode.ExtensionContext) {

    let disposable = vscode.commands.registerCommand('midas-select.select', () => {
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

/**
 * ユーザー設定を読み取り、選択後の追加アクションを実行します。
 * テキストを変化させるアクションの後は、ルーレットの状態をリセットします。
 * @param selectorIndex 成功したセレクターのインデックス。何も選択できなかった場合は-1。
 */
function executeAfterSelectAction(selectorIndex: number) {
    const config = vscode.workspace.getConfiguration('midas-select.afterSelect');
    const actionKey = selectorIndex === -1 
        ? 'noSelection' 
        : SELECTOR_INDEX_TO_CONFIG_KEY[selectorIndex];
    
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
        case 'comment-toggle':
            vscode.commands.executeCommand('editor.action.toggleLineComment');
            break;
        case 'format':
            vscode.commands.executeCommand('editor.action.formatSelection');
            break;
        default:
            break;
    }

    // ★修正点：テキストを変化させるアクションが実行された場合、
    // 次回の実行が新しいシーケンスになるよう、ルーレットの状態をリセットする。
    const mutatingActions = ['cut', 'paste', 'delete', 'comment-toggle', 'format'];
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

