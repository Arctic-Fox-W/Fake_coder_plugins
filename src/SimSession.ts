import * as vscode from "vscode";

export class SimSession {
  constructor(
    public sourceUri: vscode.Uri,
    public languageId: string,
    public content: string
  ) {}
  revealPos = 0;
  applyingEdit = false;
  inPlace = false;
  anchor?: vscode.Position;
}

export class SimSession {
  constructor(
    public sourceUri: vscode.Uri,
    public languageId: string,
    public content: string
  ) {}
  revealPos = 0;
  applyingEdit = false;
  inPlace = false;
  anchor?: vscode.Position;
}
