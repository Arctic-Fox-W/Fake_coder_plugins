import * as vscode from "vscode";
import { SimSession } from "./SimSession";

export class SimWriteProvider implements vscode.TextDocumentContentProvider {
  private emitter = new vscode.EventEmitter<vscode.Uri>();
  readonly onDidChange = this.emitter.event;
  private sessions = new Map<string, SimSession>();

  provideTextDocumentContent(uri: vscode.Uri): string {
    return "";
  }

  async startSession(sourceUri: vscode.Uri): Promise<void> {
    const sourceDoc = await vscode.workspace.openTextDocument(sourceUri);
    const session = new SimSession(
      sourceUri,
      sourceDoc.languageId,
      sourceDoc.getText()
    );
    const simDoc = await vscode.workspace.openTextDocument({
      content: "",
      language: session.languageId,
    });
    this.sessions.set(simDoc.uri.toString(), session);
    await vscode.window.showTextDocument(simDoc, { preview: false });
  }

  startSelectionSession(targetUri: vscode.Uri, text: string, anchor: vscode.Position, languageId: string): void {
    const session = new SimSession(targetUri, languageId, text);
    session.inPlace = true;
    session.anchor = anchor;
    this.sessions.set(targetUri.toString(), session);
  }

  stopSession(simUri: vscode.Uri): void {
    this.sessions.delete(simUri.toString());
  }

  getSession(simUri: vscode.Uri): SimSession | undefined {
    return this.sessions.get(simUri.toString());
  }
}
