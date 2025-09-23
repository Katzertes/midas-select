import * as vscode from 'vscode';

/**
 * すべてのセレクタークラスが実装すべきインターフェース。
 */
export interface Selector {
    /**
     * 与えられたコンテキストで選択が可能かどうかを判断します。
     * @param editor アクティブなテキストエディタ
     * @param selection 現在の選択範囲 (カーソル位置)
     * @returns 選択可能な場合は true, それ以外は false
     */
    canSelect(editor: vscode.TextEditor, selection: vscode.Selection): boolean;

    /**
     * 実際に選択範囲を計算して返します。
     * @param editor アクティブなテキストエディタ
     * @param selection 現在の選択範囲 (カーソル位置)
     * @returns 計算された新しい選択範囲
     */
    select(editor: vscode.TextEditor, selection: vscode.Selection): vscode.Selection | null;
}
