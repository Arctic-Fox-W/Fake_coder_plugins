import * as vscode from "vscode";
import { SimWriteProvider } from "./SimWriteProvider";

export function activate(context: vscode.ExtensionContext) {
  const provider = new SimWriteProvider();
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider("simwrite", provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("simwrite.simulateSelection", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const doc = editor.document;
      if (doc.uri.scheme !== "file") return;
      const sel = editor.selection;
      if (sel.isEmpty) return;
      const text = doc.getText(sel);
      await editor.edit((eb) => eb.delete(sel), {
        undoStopBefore: true,
        undoStopAfter: true,
      });
      (provider as any).startSelectionSession(doc.uri, text, sel.start, doc.languageId);
      const start = sel.start;
      editor.selection = new vscode.Selection(start, start);
      await vscode.commands.executeCommand("setContext", "simwrite.inSelectionSession", true);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("simwrite.stealthSimulateSelection", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const doc = editor.document;
      if (doc.uri.scheme !== "file") return;
      const sel = editor.selection;
      if (sel.isEmpty) return;
      const text = doc.getText(sel);
      await editor.edit((eb) => eb.delete(sel), {
        undoStopBefore: true,
        undoStopAfter: true,
      });
      (provider as any).startSelectionSession(doc.uri, text, sel.start, doc.languageId);
      const start = sel.start;
      editor.selection = new vscode.Selection(start, start);
      await vscode.commands.executeCommand("setContext", "simwrite.inSelectionSession", true);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "simwrite.simulateSelected",
      async (uri: vscode.Uri, uris?: vscode.Uri[]) => {
        const targets =
          Array.isArray(uris) && uris.length ? uris : uri ? [uri] : [];
        for (const u of targets) {
          await provider.startSession(u);
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "simwrite.stealthSimulateSelected",
      async (uri: vscode.Uri, uris?: vscode.Uri[]) => {
        const targets =
          Array.isArray(uris) && uris.length ? uris : uri ? [uri] : [];
        for (const u of targets) {
          await provider.startSession(u);
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("simwrite.simulateActive", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const doc = editor.document;
      if (doc.uri.scheme !== "file") return;
      await provider.startSession(doc.uri);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("simwrite.stopSession", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const doc = editor.document;
      const session = (provider as any).getSession(doc.uri);
      if (!session) return;
      provider.stopSession(doc.uri);
      if (!session.inPlace) {
        await vscode.commands.executeCommand(
          "workbench.action.closeActiveEditor"
        );
      }
      if (session.inPlace) {
        await vscode.commands.executeCommand("setContext", "simwrite.inSelectionSession", false);
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((doc) => {
      const session = (provider as any).getSession(doc.uri);
      if (session) provider.stopSession(doc.uri);
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(async (ed) => {
      const v = ed ? (provider as any).getSession(ed.document.uri) : undefined;
      await vscode.commands.executeCommand("setContext", "simwrite.inSelectionSession", !!(v && v.inPlace));
    })
  );
  vscode.commands.executeCommand("setContext", "simwrite.inSelectionSession", false);

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(async (e) => {
      const doc = e.document;
      const session = (provider as any).getSession(doc.uri);
      if (!session) return;
      if (session.applyingEdit) return;
      const editor = vscode.window.visibleTextEditors.find(
        (ed) => ed.document === doc
      );
      if (!editor) return;
      const cfg = vscode.workspace.getConfiguration("simwrite");
      const perStroke = cfg.get<number>("charactersPerKeystroke", 1);
      const allowBackspace = cfg.get<boolean>("allowBackspace", true);
      const pasteMultiplier = cfg.get<number>("pasteMultiplier", 1);
      const showMsg = cfg.get<boolean>("showCompletionMessage", true);
      session.applyingEdit = true;
      let inc = 0;
      let dec = 0;
      for (const change of e.contentChanges) {
        const rangeLength =
          (change as any).rangeLength ??
          doc.offsetAt(change.range.end) - doc.offsetAt(change.range.start);
        const inserted = change.text.length;
        if (inserted > 0) {
          const isPaste = inserted > 1;
          inc += isPaste ? inserted * pasteMultiplier : inserted * perStroke;
        }
        if (rangeLength > 0) {
          dec += rangeLength;
        }
      }
      if (!allowBackspace) {
        dec = 0;
      }
      const newPos = Math.max(
        0,
        Math.min(session.content.length, session.revealPos + inc - dec)
      );
      const prefix = session.content.slice(0, newPos);
      await editor.edit(
        (eb) => {
          if (session.inPlace && session.anchor) {
            const start = session.anchor;
            const startOffset = doc.offsetAt(start);
            const existingEnd = doc.positionAt(startOffset + session.revealPos);
            const range = new vscode.Range(start, existingEnd);
            eb.replace(range, prefix);
          } else {
            const full = new vscode.Range(
              doc.positionAt(0),
              doc.positionAt(doc.getText().length)
            );
            eb.replace(full, prefix);
          }
        },
        { undoStopBefore: false, undoStopAfter: false }
      );
      session.revealPos = newPos;
      if (session.inPlace && session.anchor) {
        const startOffset = doc.offsetAt(session.anchor);
        const end = doc.positionAt(startOffset + session.revealPos);
        editor.selection = new vscode.Selection(end, end);
      } else {
        const end = doc.positionAt(session.revealPos);
        editor.selection = new vscode.Selection(end, end);
      }
      session.applyingEdit = false;
      if (session.revealPos >= session.content.length && showMsg) {
        vscode.window.showInformationMessage("已全部显示");
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("type", async (args: { text: string }) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const doc = editor.document;
      const session = (provider as any).getSession(doc.uri);
      if (!session) {
        await vscode.commands.executeCommand("default:type", args);
        return;
      }
      const cfg = vscode.workspace.getConfiguration("simwrite");
      const perStroke = cfg.get<number>("charactersPerKeystroke", 1);
      const showMsg = cfg.get<boolean>("showCompletionMessage", true);
      const inc = (session.inPlace ? 1 : Math.max(perStroke, 1));
      const newPos = Math.max(
        0,
        Math.min(session.content.length, session.revealPos + inc)
      );
      const prefix = session.content.slice(0, newPos);
      session.applyingEdit = true;
      await editor.edit(
        (eb) => {
          if (session.inPlace && session.anchor) {
            const start = session.anchor;
            const startOffset = doc.offsetAt(start);
            const existingEnd = doc.positionAt(startOffset + session.revealPos);
            const range = new vscode.Range(start, existingEnd);
            eb.replace(range, prefix);
          } else {
            const full = new vscode.Range(
              doc.positionAt(0),
              doc.positionAt(doc.getText().length)
            );
            eb.replace(full, prefix);
          }
        },
        { undoStopBefore: false, undoStopAfter: false }
      );
      session.revealPos = newPos;
      if (session.inPlace && session.anchor) {
        const startOffset = doc.offsetAt(session.anchor);
        const end = doc.positionAt(startOffset + session.revealPos);
        editor.selection = new vscode.Selection(end, end);
      } else {
        const end = doc.positionAt(session.revealPos);
        editor.selection = new vscode.Selection(end, end);
      }
      session.applyingEdit = false;
      if (session.revealPos >= session.content.length && showMsg) {
        vscode.window.showInformationMessage("已全部显示");
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("deleteLeft", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const doc = editor.document;
      const session = (provider as any).getSession(doc.uri);
      if (!session) {
        await vscode.commands.executeCommand("default:deleteLeft");
        return;
      }
      const cfg = vscode.workspace.getConfiguration("simwrite");
      const allowBackspace = cfg.get<boolean>("allowBackspace", true);
      const showMsg = cfg.get<boolean>("showCompletionMessage", true);
      if (!allowBackspace) return;
      const newPos = Math.max(0, session.revealPos - 1);
      const prefix = session.content.slice(0, newPos);
      session.applyingEdit = true;
      await editor.edit(
        (eb) => {
          if (session.inPlace && session.anchor) {
            const start = session.anchor;
            const startOffset = doc.offsetAt(start);
            const existingEnd = doc.positionAt(startOffset + session.revealPos);
            const range = new vscode.Range(start, existingEnd);
            eb.replace(range, prefix);
          } else {
            const full = new vscode.Range(
              doc.positionAt(0),
              doc.positionAt(doc.getText().length)
            );
            eb.replace(full, prefix);
          }
        },
        { undoStopBefore: false, undoStopAfter: false }
      );
      session.revealPos = newPos;
      if (session.inPlace && session.anchor) {
        const startOffset = doc.offsetAt(session.anchor);
        const end = doc.positionAt(startOffset + session.revealPos);
        editor.selection = new vscode.Selection(end, end);
      } else {
        const end = doc.positionAt(session.revealPos);
        editor.selection = new vscode.Selection(end, end);
      }
      session.applyingEdit = false;
      if (session.revealPos >= session.content.length && showMsg) {
        vscode.window.showInformationMessage("已全部显示");
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "editor.action.clipboardPasteAction",
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        const doc = editor.document;
        const session = (provider as any).getSession(doc.uri);
        if (!session) {
          const text = await vscode.env.clipboard.readText();
          await vscode.commands.executeCommand("default:type", { text });
          return;
        }
        const cfg = vscode.workspace.getConfiguration("simwrite");
        const pasteMultiplier = cfg.get<number>("pasteMultiplier", 1);
        const showMsg = cfg.get<boolean>("showCompletionMessage", true);
        const text = await vscode.env.clipboard.readText();
        const inc = Math.max(1, text.length * Math.max(1, pasteMultiplier));
        const newPos = Math.max(
          0,
          Math.min(session.content.length, session.revealPos + inc)
        );
        const prefix = session.content.slice(0, newPos);
        session.applyingEdit = true;
        await editor.edit(
          (eb) => {
            if (session.inPlace && session.anchor) {
              const start = session.anchor;
              const startOffset = doc.offsetAt(start);
              const existingEnd = doc.positionAt(startOffset + session.revealPos);
              const range = new vscode.Range(start, existingEnd);
              eb.replace(range, prefix);
            } else {
              const full = new vscode.Range(
                doc.positionAt(0),
                doc.positionAt(doc.getText().length)
              );
              eb.replace(full, prefix);
            }
          },
          { undoStopBefore: false, undoStopAfter: false }
        );
        session.revealPos = newPos;
        if (session.inPlace && session.anchor) {
          const startOffset = doc.offsetAt(session.anchor);
          const end = doc.positionAt(startOffset + session.revealPos);
          editor.selection = new vscode.Selection(end, end);
        } else {
          const end = doc.positionAt(session.revealPos);
          editor.selection = new vscode.Selection(end, end);
        }
        session.applyingEdit = false;
        if (session.revealPos >= session.content.length && showMsg) {
          vscode.window.showInformationMessage("已全部显示");
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("simwrite.stopSelectionSession", async () => {
      await vscode.commands.executeCommand("simwrite.stopSession");
      await vscode.commands.executeCommand("setContext", "simwrite.inSelectionSession", false);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("simwrite.stealthStopSelectionSession", async () => {
      await vscode.commands.executeCommand("simwrite.stopSession");
      await vscode.commands.executeCommand("setContext", "simwrite.inSelectionSession", false);
    })
  );
}

export function deactivate() {}
