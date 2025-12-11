// 自定义弹窗函数
function showCustomAlert(message, duration = 3000) {
  const alertElement = document.getElementById('custom-alert');
  if (!alertElement) {
    console.error('未找到自定义弹窗元素');
    return;
  }

  alertElement.textContent = message;
  alertElement.classList.add('show');

  // 设置定时器，duration毫秒后自动隐藏
  setTimeout(() => {
    alertElement.classList.remove('show');
  }, duration);
}

// 为提取文字按钮添加点击事件监听
const extractBtn = document.getElementById('extract-text-btn');
extractBtn.addEventListener('click', () => {
  console.log("用户点击了'提取文字'按钮");

  // 向当前标签页的内容脚本发送消息
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      console.error('没有找到当前标签页');
      return;
    }

    const tab = tabs[0];
    const tabId = tab.id;
    console.log('当前标签页ID:', tabId);
    console.log('当前标签页URL:', tab.url);

    // 检查是否是chrome://等特殊页面
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('about:')) {
      console.error('无法在特殊页面上运行插件');
      showCustomAlert('无法在特殊页面上运行插件');
      return;
    }

    // 发送消息
    chrome.tabs.sendMessage(tabId, { action: 'extractText' }, (response) => {
      if (chrome.runtime.lastError) {
        // 详细记录错误信息
        console.error('消息发送失败:', chrome.runtime.lastError.message);
        console.error('错误详细信息:', chrome.runtime.lastError);

        // 更详细的错误提示
        showCustomAlert('消息发送失败：' + chrome.runtime.lastError.message + '\n\n请尝试：\n1. 按F5刷新网页\n2. 在chrome://extensions/中刷新插件\n3. 重新点击按钮');
        return;
      }

      if (response) {
        console.log('消息响应:', response);
        showCustomAlert(response.message); // 向用户显示操作结果
      }
    });
  });
});

// 为提取地址按钮添加点击事件监听
const extractAddressBtn = document.getElementById('extract-address-btn');
extractAddressBtn.addEventListener('click', () => {
  console.log("用户点击了'提取地址'按钮");

  // 获取当前标签页URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      console.error('没有找到当前标签页');
      return;
    }

    const tab = tabs[0];
    const tabUrl = tab.url;

    // 检查是否是chrome://等特殊页面
    if (tabUrl.startsWith('chrome://') || tabUrl.startsWith('about:')) {
      console.error('无法在特殊页面上运行插件');
      showCustomAlert('无法在特殊页面上运行插件');
      return;
    }

    try {
      // 解析URL并去除query参数
      const url = new URL(tabUrl);
      const cleanUrl = `${url.origin}${url.pathname}`;

      console.log('当前URL:', tabUrl);
      console.log('去除参数后的URL:', cleanUrl);

      // 复制到剪贴板
      navigator.clipboard.writeText(cleanUrl).then(() => {
        showCustomAlert('地址已复制到剪贴板!');
      }).catch((err) => {
        console.error('复制失败:', err);
        showCustomAlert('复制失败，请重试');
      });
    } catch (err) {
      console.error('URL解析失败:', err);
      showCustomAlert('URL解析失败');
    }
  });
});

// 为下载图片按钮添加点击事件监听
const downloadImagesBtn = document.getElementById('download-images-btn');
downloadImagesBtn.addEventListener('click', () => {
  console.log("用户点击了'下载图片'按钮");

  // 向当前标签页的内容脚本发送消息
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      console.error('没有找到当前标签页');
      return;
    }

    const tab = tabs[0];
    const tabId = tab.id;
    console.log('当前标签页ID:', tabId);
    console.log('当前标签页URL:', tab.url);

    // 检查是否是chrome://等特殊页面
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('about:')) {
      console.error('无法在特殊页面上运行插件');
      showCustomAlert('无法在特殊页面上运行插件');
      return;
    }

    // 发送消息
    chrome.tabs.sendMessage(tabId, { action: 'downloadImages' }, (response) => {
      if (chrome.runtime.lastError) {
        // 详细记录错误信息
        console.error('消息发送失败:', chrome.runtime.lastError.message);
        console.error('错误详细信息:', chrome.runtime.lastError);

        // 更详细的错误提示
        showCustomAlert('消息发送失败：' + chrome.runtime.lastError.message + '\n\n请尝试：\n1. 按F5刷新网页\n2. 在chrome://extensions/中刷新插件\n3. 重新点击按钮');
        return;
      }

      if (response) {
        console.log('消息响应:', response);
        showCustomAlert(response.message); // 向用户显示操作结果
      }
    });
  });
});
