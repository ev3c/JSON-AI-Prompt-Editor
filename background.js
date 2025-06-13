// Este script se ejecuta en segundo plano
chrome.runtime.onInstalled.addListener(() => {
  console.log('JSON AI Prompt Editor instalado');
});

// Cuando se hace clic en el icono de la extensión, abre una nueva pestaña
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('jsonEditor/jsonEditor.html')
  });
}); 