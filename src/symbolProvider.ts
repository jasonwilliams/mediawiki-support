import * as vscode from "vscode";
const SymbolKind = vscode.SymbolKind;
const SymbolInformation = vscode.SymbolInformation;
const Location = vscode.Location;

const symbolPatterns = [
  {
    kind: SymbolKind.String,
    pattern: /(={1,6})\s*(.+?)\s*(\1)(?!=)$/gm
  }
];

function findAllSymbols(document: vscode.TextDocument) {
  let text = document.getText();
  let symbols = [];
  for (let item of symbolPatterns) {
    let kind = item.kind;
    let match = null;
    while ((match = item.pattern.exec(text))) {
      let symbol = match[2];
      let line = document.positionAt(match.index).line;
      let range = document.lineAt(line).range;
      symbols.push(
        new SymbolInformation(
          symbol,
          kind,
          "",
          new Location(document.uri, range)
        )
      );
    }
  }
  return symbols;
}

export const documentSymbolProvider = {
  provideDocumentSymbols: (
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.SymbolInformation[]> => {
    return new Promise((resolve, reject) => {
      let symbols = findAllSymbols(document);
      resolve(symbols);
    });
  }
};
