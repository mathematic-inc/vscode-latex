import {spawnSync} from 'child_process';
import {platform} from 'os';
import {DocumentFormattingEditProvider, FormattingOptions, Range, TextDocument, TextEdit, window, workspace as Workspace} from 'vscode';
import {ConfigResolver} from './config_resolver';
import {ExecutableResolver} from './executable_resolver';
import {getConfig} from './utils';

const MAX_RANGE = new Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE);

export class LaTeXDocumentFormatter implements DocumentFormattingEditProvider {
  private static EXECUTABLE = 'latexindent';
  private static CONFIG = 'linter.config';
  private static CONFIG_NAMES = [
    'localSettings.yaml', 'latexindent.yaml', '.localSettings.yaml',
    '.latexindent.yaml',
    /** '.localSettings', '.latexindent' */
  ];

  #configResolver: ConfigResolver;
  #executableResolver: ExecutableResolver;

  constructor() {
    this.#configResolver = new ConfigResolver(
        LaTeXDocumentFormatter.CONFIG, LaTeXDocumentFormatter.CONFIG_NAMES);
    this.#executableResolver = new ExecutableResolver(
        LaTeXDocumentFormatter.EXECUTABLE,
        platform() === 'win32' ? '.exe' : '.pl');
  }

  public async provideDocumentFormattingEdits(
      document: TextDocument, options: FormattingOptions): Promise<TextEdit[]> {
    let exec = this.#executableResolver.findExecutable();
    if (!exec) {
      await window.showErrorMessage(
          `${LaTeXDocumentFormatter.EXECUTABLE} could not be found.`);
      return [];
    }

    const config = await this.#configResolver.findConfig(document);
    const {output, error} = this.execute(document, exec, options, config);
    if (!output) return [];
    if (error) {
      await window.showErrorMessage(error);
      return [];
    }

    return [TextEdit.replace(document.validateRange(MAX_RANGE), output)];
  }

  private execute(
      document: TextDocument, exec: string, options: FormattingOptions,
      configFilePath?: string) {
    const args = ['-g', '/dev/null', '-m'];
    if (configFilePath) {
      args.push('-l', configFilePath);
    } else {
      const indentOptions = {
        defaultIndent: Array(options.insertSpaces ? options.tabSize : 1)
                           .fill(options.insertSpaces ? ' ' : '\t')
                           .join(''),
        textWrapOptions: {
          columns: getConfig<number>('formatter.columnLimit'),
        },
      };
      args.push(
          '-y',
          `defaultIndent:'${indentOptions.defaultIndent}',` +
              `modifyLineBreaks:textWrapOptions:columns:${
                  indentOptions.textWrapOptions.columns}`);
    }
    args.push('-');

    const {stdout: output, stderr: error} = spawnSync(exec, args, {
      encoding: 'utf-8',
      input: document.getText(),
      timeout: 10000,
    });
    return {output: output.trim(), error};
  }
}
