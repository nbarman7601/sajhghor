// preload.js
const { contextBridge, ipcRenderer } = require('electron');
window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector);
      if (element) element.innerText = text;
    };
  
    for (const versionType of ['chrome', 'node', 'electron']) {
      replaceText(`${versionType}-version`, process.versions[versionType]);
    }
  });
  
contextBridge.exposeInMainWorld('electronAPI', {
    print: (content, styles) => ipcRenderer.send('print-content', content, styles)
});