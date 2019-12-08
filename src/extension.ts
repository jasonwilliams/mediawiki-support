import * as vscode from "vscode";
import { fetchWebContent } from "./webCitation";

export async function activate(context: vscode.ExtensionContext) {
  // register a command that opens a cowsay-document
  context.subscriptions.push(
    vscode.commands.registerCommand("extension.addWebCitation", async () => {
      vscode.window.setStatusBarMessage("Fetching Web Content...", 5000);
      let what = await vscode.window.showInputBox({
        placeHolder: "Add Web Citation..."
      });
      if (what) {
        try {
          const result = await fetchWebContent(what);
          // get active editor
          let editor = vscode.window.activeTextEditor;
          if (editor?.selection) {
            let selection = editor.selection;
            editor?.edit(editBuilder => {
              editBuilder.insert(selection.active, result);
            });
          }
        } catch (err) {
          console.log(err);
          vscode.window.setStatusBarMessage("Request failed...", 10000);
        }
      }
    })
  );
}
