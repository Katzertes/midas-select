# Midas Select : VS Code Smart Selector

[![GitHub](https://img.shields.io/badge/GitHub-Repo-blue?logo=github)](https://github.com/katzertes/midas-select)

Midas Select is a VS Code extension that provides intelligent, context-aware text selection **using a single shortcut**. Repeatedly pressing the key cycles through other possible selections. It is designed to be intuitive and versatile, working across any text file, not just code.

➡️ URL ➡️ Markdown section ➡️ Bracket block inside paragraph
➡️ Indent block ➡️ Paragraph (separated by blank lines)
➡️ Block of empty lines ➡️ Bracket block

- Default Shortcut:
<kbd>Cmd</kbd><kbd>Opt</kbd> + <kbd>E</kbd> on Mac
<kbd>Ctrl</kbd><kbd>Alt</kbd> + <kbd>E</kbd> on Windows

![Demo](https://raw.githubusercontent.com/Katzertes/midas-select/main/assets/midas_demo_360.gif)

---

Here is the English translation of the provided Japanese text:

***

## 📑 Selection Targets

The following targets are automatically selected. When used repeatedly, the selection cycles through the targets.

1. URL (when the cursor is on it)
2. In Markdown files, when the cursor is on a heading line starting with #  
   1. The entire section including the heading line  
   2. The entire section excluding the heading line  
3. Bracket block within the current paragraph  
   1. Inside the bracket characters (excluding the brackets)  
   2. The entire block including the brackets  
4. Indent block  
5. Paragraph (a block of consecutive lines separated by blank lines)  
   1. Entire paragraph (recognized by looking backwards from the cursor line)  
   2. From the cursor line to the next blank line  
6. Block of consecutive blank lines  
7. Bracket block  
   1. Inside the bracket characters (excluding the brackets)  
   2. The entire block including the brackets  

***

### 🔣 Bracket Block

When the cursor is inside, the text enclosed by bracket characters is selected. Repeating the selection includes the brackets themselves.

The bracket block search is divided into two stages: within the paragraph and unlimited area, with the latter given the lowest priority.

In source code, unmatched brackets usually trigger warnings and are rarely left unattended. However, in unorganized notes or similar files, brackets may not always be well paired. In such cases, if bracket pairs unintentionally exist far from the cursor position, there is a risk that an unexpectedly large area is selected. To prevent this, the bracket block selection is divided into two stages, where the latter has the lowest priority.

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

### #️⃣ Markdown Section

The cursor must be **on a header line** for the section to be detected. The first selection includes the header, useful for cutting and pasting entire sections. The second selection (on the next key press) selects only the content.


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

