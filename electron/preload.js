const { contextBridge, ipcRenderer } = require("electron");

/**
 * 暴露安全的 API 到渲染进程
 */
window.ipcRenderer = require("electron").ipcRenderer;

contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    send: (channel, data) => {
      ipcRenderer.send(channel, data);
    },
    on: (channel, func) => {
      ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
    },
    off: (channel, func) => {
      ipcRenderer.removeListener(channel, func);
    },
    invoke: (channel, data) => {
      return ipcRenderer.invoke(channel, data);
    },
  },
  // 文件系统操作
  fs: {
    existsSync: (filePath) => ipcRenderer.invoke("check-file-exists", filePath),
    readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),
    writeFile: (filePath, content) =>
      ipcRenderer.invoke("write-file", { filePath, content }),
  },
});
