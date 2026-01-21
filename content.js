// 确保content.js加载后立即注册消息监听器
console.log('content.js 已加载');

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('接收到来自popup的消息:', request);

  if (request.action === 'extractText') {
    // 提取页面文字
    const pageText = extractPageText();

    // 添加日志
    console.log('提取到的文字内容:', pageText);
    console.log('文字长度:', pageText.length);

    // 下载为txt文件
    if (pageText.length > 0) {
      downloadTextAsFile(pageText, () => {
        // 下载完成后发送成功响应
        sendResponse({ success: true, message: '文字提取成功，文件已下载' });
      });
    } else {
      console.error('未提取到文字内容');
      sendResponse({ success: false, message: '提取文字失败,请刷新重新 或 联系管理员' });
    }

    return true; // 保持消息通道开放，直到处理完成
  } else if (request.action === 'downloadImages') {
    // 下载页面图片
    const imagesDownloaded = downloadAllImages();

    if (imagesDownloaded > 0) {
      console.log(`成功下载 ${imagesDownloaded} 张图片`);
    } else {
      console.error('未找到可下载的图片');
    }

    return true;
  }
});

// 提取页面文字的函数 - 优化分段显示
function extractPageText() {
  // 获取用户指定的内容区域：class="col col-12 grid-col-9-lg z1"
  const targetContent = document.querySelector('.col.col-12.grid-col-9-lg.z1');
  if (!targetContent) {
    console.error('未找到目标内容区域，请检查类名是否正确');
    return '';
  }

  // 创建一个临时div来获取纯文本
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = targetContent.innerHTML;

  // 移除不需要的元素
  const unwantedElements = ['script', 'style', 'img', 'video', 'audio', 'iframe', 'svg'];
  unwantedElements.forEach(selector => {
    const elements = tempDiv.querySelectorAll(selector);
    elements.forEach(element => element.remove());
  });

  // 将HTML标签转换为换行符（保留段落结构）
  let html = tempDiv.innerHTML;

  // 将<p>标签转换为两个换行符（段落分隔）
  html = html.replace(/<p[^>]*>/g, '\n\n');

  // 将<br>标签转换为一个换行符（行分隔）
  html = html.replace(/<br[^>]*>/g, '\n');

  // 移除所有剩余的HTML标签
  html = html.replace(/<[^>]+>/g, '');

  // 获取纯文本
  let text = html || '';

  // 清理文本格式
  text = text
    // 替换HTML实体
    .replace(/&nbsp;/g, ' ')  // 替换非-breaking space
    .replace(/&amp;/g, '&')    // 替换&符号
    .replace(/&lt;/g, '<')     // 替换<符号
    .replace(/&gt;/g, '>')     // 替换>符号
    .replace(/&quot;/g, '"')   // 替换"符号
    .replace(/&#39;/g, "'")    // 替换'符号
    .replace(/&awp;/g, '')     // 替换特定的&awp;实体
    .replace(/&#?[a-zA-Z0-9]+;/g, '') // 移除所有其他HTML实体
    // 将每行的连续空格替换为一个空格
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    // 过滤掉空行
    .filter(line => line.length > 0)
    // 段落之间用两个换行符分隔
    .join('\n\n')
    .trim();

  return text;
}

// 下载文本为txt文件的函数
function downloadTextAsFile(text, callback) {
  const filename = `page-text-${Date.now()}.txt`;

  // 创建Blob对象
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });

  // 创建下载链接
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = filename;

  // 模拟点击下载
  document.body.appendChild(link);
  link.click();

  // 清理资源
  document.body.removeChild(link);
  setTimeout(() => {
    URL.revokeObjectURL(url);
    // 调用回调函数表示下载完成
    if (callback) callback();
  }, 100);
}

// 下载文件（支持单个图片或压缩包，使用Chrome下载API）
function downloadFile(fileUrl, isZip = false, total = 1) {
  return new Promise((resolve, reject) => {
    // 提取文件扩展名
    const ext = fileUrl.match(/\.(\w+)(\?|$)/) ? fileUrl.match(/\.(\w+)(\?|$)/)[1] : 'jpg';

    // 生成文件名：压缩包单独命名为images.zip，普通图片按序号命名
    const filename = isZip
      ? 'rolys-images/images.zip' // 压缩包固定命名为images.zip
      : `rolys-images/image-${String(total).padStart(2, '0')}.${ext}`; // 单张图片命名

    // 发送下载请求到Service Worker
    chrome.runtime.sendMessage(
      {
        action: 'downloadImage', // 复用已有downloadImage接口（参数兼容）
        url: fileUrl,
        filename: filename
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('下载请求发送失败:', chrome.runtime.lastError, 'URL:', fileUrl);
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      }
    );
  });
}

// 下载所有图片的函数（通过Node服务器生成压缩包）
function downloadAllImages() {
  // 获取用户指定的内容区域：class="col col-12 grid-col-9-lg z1"
  const targetContent = document.querySelector('.col.col-12.grid-col-9-lg.z1');
  if (!targetContent) {
    console.error('未找到目标内容区域，请检查类名是否正确');
    return 0;
  }

  // 获取所有img元素
  const images = targetContent.querySelectorAll('img');
  if (images.length === 0) {
    console.error('未找到任何图片');
    return 0;
  }

  // 提取所有有效的图片URL
  const imageUrls = Array.from(images)
    .map(img => img.src)
    .filter(src => src && src.startsWith('http'));

  if (imageUrls.length === 0) {
    console.error('未找到有效的图片URL');
    return 0;
  }

  // 统一发送给Node服务器生成压缩包
  (async () => {
    try {
      console.log('开始将', imageUrls.length, '张图片URL发送给Node服务器...');

      // 发送POST请求到Node服务器
      const response = await fetch('https://rolyyung.top/api/download-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageUrls: imageUrls
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP错误! 状态码: ${response.status}`);
      }

      const result = await response.json();
      console.log('Node服务器响应:', result);

      // 检查是否返回压缩包URL（需与Node服务器返回字段一致）
      if (result.code === 200 && result.data.zipUrl) {
        console.log('开始下载服务器返回的压缩包...');

        try {
          // 下载压缩包（标记isZip为true，自动命名为images.zip）
          await downloadFile(result.data.zipUrl, true, imageUrls.length);
          console.log('压缩包下载请求已发送');
        } catch (error) {
          console.error('下载压缩包失败:', error, 'URL:', result.data.zipUrl);
          alert('下载压缩包失败: ' + error.message);
        }
      } else {
        console.error('未从服务器获取到压缩包URL');
        alert('未从服务器获取到压缩包URL，请检查服务器配置');
      }

    } catch (error) {
      console.error('与Node服务器通信失败:', error);
      alert('与Node服务器通信失败，请检查服务器连接或重试');
    }
  })();

  return imageUrls.length;
}
