/**
 * @file 类型声明文件
 * @description 为项目添加全局类型声明
 */

import { IpcRenderer } from "electron";

declare global {
  interface Window {
    electron: {
      ipcRenderer: IpcRenderer;
    };
  }
}

/**
 * 树节点数据类型
 */
export interface TreeNode {
  key: string;
  title: string;
  code?: string;
  language?: string;
  parentKey?: string;
  children?: TreeNode[];
}

/**
 * 代码片段数据类型
 */
export interface CodeSnippet {
  key: string;
  title: string;
  code: string;
  language: string;
  parentKey?: string;
}
