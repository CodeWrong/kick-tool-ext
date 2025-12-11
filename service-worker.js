// 监听来自content.js的下载请求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'downloadImage') {
    const { url, filename } = request;
    console.log('Service Worker收到下载请求:', url, filename);

    // 使用Chrome下载API
    chrome.downloads.download({
      url: url,
      filename: filename,
      conflictAction: 'uniquify', // 如果文件名重复则自动添加编号
      saveAs: false // 不显示保存对话框，使用默认下载路径
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('下载请求失败:', chrome.runtime.lastError);
      } else {
        console.log('下载请求已发送，downloadId:', downloadId);
      }
    });

  }
});

// 监听下载状态变化（可选）
chrome.downloads.onChanged.addListener((delta) => {
  if (delta.state && delta.state.current === 'complete') {
    console.log('下载完成:', delta.id);
  } else if (delta.state && delta.state.current === 'interrupted') {
    console.error('下载中断:', delta.id, delta.error);
  }
});

