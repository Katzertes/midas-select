# Midas Select : VS Code Smart Selector

[![GitHub](https://img.shields.io/badge/GitHub-Repo-blue?logo=github)](https://github.com/katzertes/midas-select)

Midas Select is a VS Code extension that provides intelligent, context-aware text selection **using a single shortcut**. Repeatedly pressing the key cycles through other possible selections. It is designed to be intuitive and versatile, working across any text file, not just code.

```text
URL > Markdown section > Parenthesized block
> Indented block > Empty lines
> Paragraphs (separated by empty lines) >
```

- Default Shortcut:
<kbd>Cmd</kbd><kbd>Opt</kbd> + <kbd>E</kbd> on Mac
<kbd>Ctrl</kbd><kbd>Alt</kbd> + <kbd>E</kbd> on Windows

![Demo](https://raw.githubusercontent.com/Katzertes/midas-select/main/assets/midas_demo_360.gif)

---

## 📑 Selection Targets

The extension automatically selects the most relevant block of text. Press the shortcut again to cycle through the following targets:

1. URL: If the cursor is on a URL.
2. Markdown Section: If the cursor is on a header line (# ...) in a Markdown file.
   1. The entire section, including the header line.
   2. The section content, excluding the header line.
3. Bracket Block:
   1. The content inside a pair of brackets (excluding the brackets).
   2. The entire block, including the brackets themselves.
4. Indent Block: A block of lines with the same indentation.
5. Empty Lines Block: A contiguous block of empty lines.
6. Paragraph: A block of text separated by empty lines.
   1. The entire paragraph.
   2. From the cursor to the end of the paragraph.

### #️⃣ Markdown Section

The cursor must be **on a header line** for the section to be detected. The first selection includes the header, useful for cutting and pasting entire sections. The second selection (on the next key press) selects only the content.

### 🔣 Bracket Block

If the cursor is inside a bracketed expression, the content is selected. Pressing the key again expands the selection to include the brackets.

#### 🔤 Supported Brackets
```text
ASCII brackets:
( ) [ ] { } < >
Full-width:
（ ） ［ ］ ｛ ｝ ＜ ＞
〈 〉 《 》 « »
Full-width for Japanese:
「 」 『 』 〔 〕 【 】
```

### ↔️ Indent Block

An indent block is a series of lines that start with the same leading characters. This includes not only whitespace (spaces/tabs) but also symbols like quote markers.

```c
    // indent
    // indent
// no indent
// no indent
/*
>> This is also an indent block.
>> Midas Select treats the '>> ' as an indent
>> and selects all three lines.
*/
```

---

## ⚙️ Settings

You can configure Midas Select to automatically perform an action (like `copy`) after a selection is made.

- Recommended daily setup:
  - MarkDown Content : copy
  - Paragraph : copy

⚠️ Important Notes on Post-Actions:

- ⚠️ The selection cycle will be reset if you use any action other than `none` or `copy`. Those actions (`cut`, `paste`, `delete`, `format`, and `apply-comment`) will most likely modify the text; in that case, the cyclic selection sequence must start over. Think of them as one-shot macros for specific, repetitive tasks.

- ⚠️ `apply comment` does not guarantee a toggle. Since Midas Select's behavior is context-dependent, using it repeatedly is not guaranteed to toggle comments on and off for the same block of text.

