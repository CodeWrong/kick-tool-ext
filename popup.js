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

// ==================== 汇率转换功能（紧凑扁平设计）====================

// DOM 元素
const currencyAmountInput = document.getElementById('currency-amount');
const currencyResult = document.getElementById('currency-result');
const exchangeRateText = document.getElementById('exchange-rate');
const lastUpdateText = document.getElementById('last-update');
const swapBtn = document.getElementById('swap-btn');
const sourceFlag = document.getElementById('source-flag');
const sourceCode = document.getElementById('source-code');
const targetFlag = document.getElementById('target-flag');
const targetCode = document.getElementById('target-code');
const sourceSide = document.getElementById('source-side');

// 币种配置
const currencies = {
  USD: { flag: '🇺🇸', name: '美元' },
  CNY: { flag: '🇨🇳', name: '人民币' }
};

// 当前币种状态
let currencyState = {
  from: 'USD',
  to: 'CNY'
};

// 汇率缓存
let exchangeRateCache = {
  usdToCny: null,
  cnyToUsd: null,
  timestamp: null,
  expiry: 10 * 60 * 1000 // 10分钟缓存
};

// 防抖计时器
let debounceTimer = null;

// 格式化时间差
function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000); // 秒

  if (diff < 60) return '';
  if (diff < 3600) return `· ${Math.floor(diff / 60)}分钟前`;
  return `· ${Math.floor(diff / 3600)}小时前`;
}

// 更新币种显示
function updateCurrencyDisplay() {
  sourceFlag.textContent = currencies[currencyState.from].flag;
  sourceCode.textContent = currencyState.from;
  targetFlag.textContent = currencies[currencyState.to].flag;
  targetCode.textContent = currencyState.to;
}

// 互换币种
function swapCurrencies() {
  const temp = currencyState.from;
  currencyState.from = currencyState.to;
  currencyState.to = temp;

  updateCurrencyDisplay();

  // 清空输入和输出
  currencyAmountInput.value = '';
  currencyResult.value = '';
}

// 获取汇率
async function fetchExchangeRate(from, to) {
  const cacheKey = `${from.toLowerCase()}To${to.charAt(0).toUpperCase() + to.slice(1).toLowerCase()}`;

  // 检查缓存
  if (exchangeRateCache[cacheKey] && exchangeRateCache.timestamp) {
    const now = Date.now();
    if (now - exchangeRateCache.timestamp < exchangeRateCache.expiry) {
      console.log(`使用缓存汇率 (${from}/${to}):`, exchangeRateCache[cacheKey]);
      return exchangeRateCache[cacheKey];
    }
  }

  try {
    // 显示加载状态
    exchangeRateText.innerHTML = '<span class="loading-spinner"></span>获取汇率中...';

    // 调用Frankfurter API
    const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);

    if (!response.ok) {
      throw new Error(`HTTP错误! 状态码: ${response.status}`);
    }

    const data = await response.json();

    if (!data.rates || !data.rates[to]) {
      throw new Error('API返回的数据格式不正确');
    }

    const rate = data.rates[to];

    // 更新缓存
    exchangeRateCache[cacheKey] = rate;
    exchangeRateCache.timestamp = Date.now();

    // 同时缓存反向汇率
    const reverseCacheKey = `${to.toLowerCase()}To${from.charAt(0).toUpperCase() + from.slice(1).toLowerCase()}`;
    exchangeRateCache[reverseCacheKey] = 1 / rate;

    console.log(`获取到实时汇率 (${from}/${to}):`, rate);

    // 更新汇率显示
    exchangeRateText.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}${formatTimeAgo(exchangeRateCache.timestamp)}`;

    return rate;

  } catch (error) {
    console.error('获取汇率失败:', error);

    // 如果API失败，尝试使用缓存
    if (exchangeRateCache[cacheKey]) {
      console.log(`API失败，使用缓存汇率 (${from}/${to}):`, exchangeRateCache[cacheKey]);
      exchangeRateText.textContent = `1 ${from} = ${exchangeRateCache[cacheKey].toFixed(4)} ${to}·缓存`;
      return exchangeRateCache[cacheKey];
    }

    // 如果没有缓存，使用默认汇率
    const defaultRate = from === 'USD' ? 7.2 : 0.1389;
    console.log(`API失败且无缓存，使用默认汇率 (${from}/${to}):`, defaultRate);
    exchangeRateText.textContent = `1 ${from} = ${defaultRate.toFixed(4)} ${to}·默认`;
    return defaultRate;
  }
}

// 执行转换
async function performConversion() {
  const amount = parseFloat(currencyAmountInput.value);

  // 清除之前的加载状态
  if (exchangeRateText.querySelector('.loading-spinner')) {
    // 正在加载中，不重复请求
    return;
  }

  // 验证输入
  if (isNaN(amount) || amount <= 0) {
    currencyResult.value = '';
    return;
  }

  try {
    // 获取汇率
    const exchangeRate = await fetchExchangeRate(currencyState.from, currencyState.to);

    if (!exchangeRate) {
      throw new Error('无法获取汇率');
    }

    // 计算结果
    const result = (amount * exchangeRate).toFixed(2);

    // 显示结果
    currencyResult.value = result;

  } catch (error) {
    console.error('转换失败:', error);
    currencyResult.value = '失败';
  }
}

// 输入框防抖处理
currencyAmountInput.addEventListener('input', () => {
  // 清除之前的计时器
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // 设置新的计时器（300ms防抖）
  debounceTimer = setTimeout(() => {
    performConversion();
  }, 300);
});

// 输入框聚焦效果
currencyAmountInput.addEventListener('focus', () => {
  sourceSide.classList.add('input-focused');
});

currencyAmountInput.addEventListener('blur', () => {
  sourceSide.classList.remove('input-focused');
});

// 互换按钮事件
swapBtn.addEventListener('click', swapCurrencies);

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
  // 更新币种显示
  updateCurrencyDisplay();

  // 预加载汇率
  fetchExchangeRate('USD', 'CNY');
});
