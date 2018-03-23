'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

interface Snippet {
    index: number;
    content: string;
}
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    const formatString: string = "f \"regex\" f \"regex\" f \"regex\" .... r \"regex\"";
    console.log('Congratulations, your extension "regex-recursive" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    const validateInput = function (inputText: string): number {
        //TODO: add the logic to validate regex
        const isMatch: number = inputText.search("^(f \".*?\")+(r \".*?\")*$");
        return isMatch;
    };
    const regexIndexOf = function (text: string, re: string, i: number) {
        var indexInSuffix = text.slice(i).search(re);
        return indexInSuffix < 0 ? indexInSuffix : indexInSuffix + i;
    };

    const extractFilterRegex = function (originalInput: string): string[] {
        const regex: RegExp = /(f \".*?\")/g;
        return (<RegExpMatchArray>originalInput.match(regex));
    }

    const extractReplaceString = function (originalInput: string): string {
        const regex: RegExp = /(r \".*?\")/g;
        const matches: string[] = (<RegExpMatchArray>originalInput.match(regex));
        if (matches === null || matches.length !== 1) {
            return "";
        }
        return matches[0].slice(3, matches[0].length - 1);
    }

    const decorationType = vscode.window.createTextEditorDecorationType({
        borderWidth: '1px',
        borderStyle: 'solid',
        overviewRulerColor: 'blue',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        light: {
            // this color will be used in light color themes
            borderColor: 'darkblue',
            backgroundColor: 'lightgreen'
        },
        dark: {
            // this color will be used in dark color themes
            borderColor: 'lightblue',
            backgroundColor: 'lightgreen'
        }
    });

    let disposable = vscode.commands.registerCommand('extension.pipedRegex', () => {
        // The code you place here will be executed every time your command is executed
        let editor = vscode.window.activeTextEditor;
        const inputOptions: vscode.InputBoxOptions = {
            placeHolder: formatString,
            prompt: "Add the regex above in the specified format: " + formatString,
            validateInput: function validate(inputText: string) {
                if (editor === null) {
                    return "Please open a file to use this regex";
                }
                const isMatch: number = validateInput(inputText);
                if (isMatch === -1) {
                    return "Invalid! Check format: " + formatString;
                } else {
                    return "";
                }
            }
        };
        vscode.window.showInputBox(inputOptions).then((inputString) => {
            // this text should be a regex 
            //validate
            let editor = vscode.window.activeTextEditor;
            if (editor === null) {
                vscode.window.showInformationMessage("Please open a file to use this regex");
                return "Please open a file to use this regex";
            }
            if (inputString === undefined || validateInput(inputString) === -1) {
                vscode.window.showInformationMessage("Please enter a valid format");
                return "Please enter a valid format";
            }
            let text = (<vscode.TextEditor>editor).document.getText();
            //separate out regex
            let filters: string[] = [];
            let replace: string;
            //extract regex out of inputString
            filters = extractFilterRegex(<string>inputString);
            replace = extractReplaceString(<string>inputString);
            let toBeFiltered: Snippet[] = [];
            toBeFiltered.push({ index: 0, content: text });
            filters.forEach((filter) => {
                const temparr: Snippet[] = [];
                toBeFiltered.forEach((snippet) => {
                    try {
                        const reg = new RegExp(filter.slice(3, filter.length - 1), 'g');
                        let match;
                        while (match = reg.exec(snippet.content)) {
                            temparr.push({ index: snippet.index + match.index, content: match[0] });
                        }
                    } catch (e) {
                        vscode.window.showInformationMessage("Something wrong with regex");
                        return "Something wrong with regex";
                    }


                });
                toBeFiltered = temparr;
            });
            const activeEditor = (<vscode.TextEditor>vscode.window.activeTextEditor);
            let decorations: vscode.DecorationOptions[] = [];
            const ranges: vscode.Range[] = [];
            toBeFiltered.forEach((entry: Snippet) => {
                let match;
                const startPos = activeEditor.document.positionAt(<number>entry.index);
                const endPos = activeEditor.document.positionAt(<number>entry.index + <number>entry.content.length);
                ranges.push(new vscode.Range(startPos, endPos));
                const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: "Finally found" };
                decorations.push(decoration);
                // const reg = new RegExp(entry.content, 'g');
                // while (match = reg.exec(activeEditor.document.getText())) {
                //     const startPos = activeEditor.document.positionAt(<number>match.index);
                //     const endPos = activeEditor.document.positionAt(<number>match.index + <number>match[0].length);
                //     const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'Number **' + match[0] + '**' };
                //     decorations.push(decoration);
                // }
            });
            (<vscode.TextEditor>vscode.window.activeTextEditor).setDecorations(decorationType, decorations);
            let offset: number = 0;
            let prevLine: number = ranges[0].start.line;
            let newHighlightRanges: vscode.Range[] = []
            if (replace !== "") {
                vscode.window.showWarningMessage("Going ahead with replace, Are you sure?", "Yes", "No").then((selectedValue) => {
                    if (selectedValue === "Yes") {
                        activeEditor.edit(function (editBuilder: vscode.TextEditorEdit) {
                            ranges.forEach((range) => {
                                const diff: number = replace.length - (range.end.character - range.start.character);
                                if (prevLine !== range.start.line) {
                                    offset = 0;
                                    prevLine = range.start.line;
                                }
                                newHighlightRanges.push(new vscode.Range(new vscode.Position(range.start.line, range.start.character + offset), new vscode.Position(range.end.line, range.end.character + offset + diff)));
                                editBuilder.replace(range, replace);

                                offset = offset + diff;


                            });
                        }).then((done: boolean) => {
                            if (done) {
                                decorations = [];
                                newHighlightRanges.forEach((range) => {
                                    const decoration = { range: range, hoverMessage: "Replaced" };
                                    decorations.push(decoration);
                                });
                                (<vscode.TextEditor>vscode.window.activeTextEditor).setDecorations(decorationType, decorations);
                            }
                        });
                    } else {
                        vscode.window.showInformationMessage("No replace happened");
                    }
                });

            }


            // console.log((<vscode.TextEditor>editor).selection);
            // (<vscode.TextEditor>editor).selections[0] = new vscode.Selection(new vscode.Position(1, 3), new vscode.Position(1, 5));






        });




    });

    context.subscriptions.push(disposable);
}


// if (!editor) {
//     vscode.window.showInformationMessage("No character whatsoever");
//     return; // No open text editor
// }

// // let selection = editor.selection;
// let text = editor.document.getText();

// // Display a message box to the user
// vscode.window.showInformationMessage('Selected characters: ' + text.length);
// // Display a message box to the user
// vscode.window.showInformationMessage('Hello World!');


// this method is called when your extension is deactivated
export function deactivate() {
}