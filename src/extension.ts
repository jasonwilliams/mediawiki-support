import * as vscode from "vscode";
import { fetchWebContent } from "./webCitation";

export function activate(context: vscode.ExtensionContext) {
  // register a command that opens a cowsay-document
  context.subscriptions.push(
    vscode.commands.registerCommand("extension.addWebCitation", async () => {
      vscode.window.setStatusBarMessage("Fetching Web Content...", 5000);
      let what = await vscode.window.showInputBox({
        placeHolder: "Add Web Citation..."
      });
      if (what) {
        fetchWebContent(what)
          .then((result: string) => {
            vscode.window.showInformationMessage(result);
            vscode.window.setStatusBarMessage("");
          })
          .catch(err => {
            console.log(err);
            vscode.window.setStatusBarMessage("Request failed...", 10000);
          });
      }
    })
  );
}
