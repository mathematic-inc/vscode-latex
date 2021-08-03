import {workspace as Workspace} from 'vscode';

export const getConfig = <T>(section: string) =>
    Workspace.getConfiguration('latex').get<T>(section);