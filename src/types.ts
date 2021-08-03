import {Diagnostic, TextDocument} from 'vscode';

export interface DocumentLintingProvider {
  provideDocumentLintingDiagnostics(document: TextDocument):
      Promise<readonly Diagnostic[]>;
}