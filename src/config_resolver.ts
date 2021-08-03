import {existsSync} from 'fs';
import {opendir} from 'fs/promises';
import {dirname, isAbsolute, join, parse} from 'path';
import {TextDocument, workspace as Workspace} from 'vscode';
import {Cache} from './cache';
import {getConfig} from './utils';

export class ConfigResolver {
  #cache = new Cache<{config?: string;}>();

  constructor(
      private readonly configKey: string,
      private readonly possibleNames: string[]) {}

  public async findConfig(document: TextDocument) {
    let config = getConfig<string>(this.configKey);
    if (!config) {
      return await this.resolveConfig(document);
    }
    if (!isAbsolute(config)) {
      const workspaceFolder = Workspace.getWorkspaceFolder(document.uri);
      return workspaceFolder ? join(workspaceFolder.uri.fsPath, config) :
                               join(dirname(document.uri.fsPath), config);
    }
    return config;
  }

  private async resolveConfig(document: TextDocument) {
    let config = this.#cache.get('config');
    if (config && existsSync(config)) return config;

    let currDir;
    let currIndex;
    for (let currParsedPath = parse(document.uri.fsPath), i = 0;
         currParsedPath.root !== currParsedPath.dir || i > 100;
         currParsedPath = parse(currParsedPath.dir), i++) {
      currDir = await opendir(currParsedPath.dir);
      for await (const dirent of currDir) {
        if (dirent.isFile()) {
          const idx = this.possibleNames.indexOf(dirent.name);
          if (idx > -1 && idx < (currIndex || this.possibleNames.length)) {
            currIndex = idx;
            config = join(currParsedPath.dir, dirent.name);
          }
        }
      }
      if (config) break;
    }

    this.#cache.set('config', config);
    return config;
  }
}
