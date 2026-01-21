# Kickstarter 内容提取工具 (Chrome 扩展)

一个专门用于提取 Kickstarter 或类似平台页面内容的 Chrome 浏览器扩展插件。该插件可以快速提取页面文字内容、图片，并复制页面地址，方便内容整理和备份。

## 功能特性

### 1. 提取地址
- **功能**: 复制当前页面URL到剪贴板
- **特点**: 自动去除URL查询参数，只保留基础地址
- **使用场景**: 快速分享或保存页面链接

### 2. 提取文字
- **功能**: 提取特定内容区域的文字并下载为txt文件
- **特点**:
  - 智能清理HTML标签，保留段落结构
  - 自动处理HTML实体转义
  - 优化文本格式，去除多余空格
  - 文件自动命名：`page-text-时间戳.txt`
- **目标区域**: CSS选择器 `.col.col-12.grid-col-9-lg.z1`

### 3. 下载图片
- **功能**: 提取特定内容区域的所有图片并打包下载
- **特点**:
  - 自动收集图片URL
  - 通过Node服务器打包成ZIP文件
  - 批量下载，避免逐个下载的麻烦
  - 文件保存路径：`rolys-images/images.zip`
- **目标区域**: CSS选择器 `.col.col-12.grid-col-9-lg.z1`

## 技术架构

### 文件结构
```
kickstart-tool-ext/
├── manifest.json          # 插件配置文件
├── popup.html            # 弹出窗口界面
├── popup.js              # 弹出窗口逻辑
├── content.js            # 页面内容处理脚本
├── service-worker.js     # 后台服务脚本
├── icon.png              # 插件图标
└── icon-v1.png           # 旧版图标
```

### 通信流程
1. **用户交互**: popup.html → popup.js
2. **页面操作**: popup.js → content.js (通过Chrome消息传递)
3. **文件下载**: content.js → service-worker.js → Chrome下载API
4. **图片打包**: content.js → Node服务器 (https://rolyyung.top/api/download-images)

### 权限配置
- `activeTab`: 访问当前标签页
- `downloads`: 使用下载功能
- `https://rolyyung.top/*`: 访问图片打包服务器

## 安装与使用

### 安装方法
1. 打开 Chrome 浏览器，进入 `chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择本插件的文件夹

### 使用方法
1. 访问目标页面（如Kickstarter项目页面）
2. 点击浏览器工具栏中的插件图标
3. 在弹出的窗口中选择需要的功能：
   - **提取地址**: 复制页面URL到剪贴板
   - **提取文字**: 下载页面文字为txt文件
   - **下载图片**: 下载页面图片为ZIP压缩包

## 技术实现细节

### 文字提取优化
```javascript
// 主要处理步骤：
1. 定位目标内容区域 (.col.col-12.grid-col-9-lg.z1)
2. 移除脚本、样式、图片等不需要的元素
3. 将HTML标签转换为换行符（保留段落结构）
4. 清理HTML实体转义字符
5. 优化空格和换行格式
6. 生成纯文本并下载
```

### 图片下载流程
```javascript
// 主要处理步骤：
1. 收集目标区域的所有图片URL
2. 发送POST请求到Node服务器
3. 服务器打包图片为ZIP文件
4. 返回ZIP文件下载链接
5. 使用Chrome下载API下载ZIP文件
```

### 错误处理
- 特殊页面检测（chrome://, about:）
- 详细的错误日志记录
- 用户友好的提示信息
- 网络请求失败重试提示

## 配置说明

### manifest.json 配置
```json
{
  "name": "kickstarer-tool-roly",
  "version": "1.0",
  "description": "Extract page text and download as txt file",
  "permissions": ["activeTab", "downloads"],
  "host_permissions": ["https://rolyyung.top/*"]
}
```

### 目标区域配置
插件针对特定的CSS选择器提取内容：
- 文字提取: `.col.col-12.grid-col-9-lg.z1`
- 图片提取: `.col.col-12.grid-col-9-lg.z1` 内的所有img元素

如需适配其他网站结构，需要修改content.js中的选择器。

## 开发说明

### 环境要求
- Chrome 浏览器 88+（支持Manifest V3）
- Node.js 服务器（用于图片打包功能）

### 本地开发
1. 克隆或下载代码
2. 按照"安装方法"加载插件
3. 修改代码后，在扩展管理页面点击刷新按钮

### 调试方法
- 右键点击插件图标 → "检查弹出内容"
- 查看控制台日志了解插件运行状态
- 使用Chrome开发者工具调试content.js

## 注意事项

1. **权限安全**: 插件仅请求必要的权限，不会访问无关数据
2. **数据隐私**: 所有操作都在本地完成，文字提取不发送到服务器
3. **图片处理**: 图片打包功能需要连接到指定的Node服务器
4. **兼容性**: 针对特定网站结构设计，可能需要调整选择器适配其他网站

## 更新日志

### v1.0 (初始版本)
- 实现基本文字提取功能
- 实现图片打包下载功能
- 实现URL复制功能
- 优化用户界面和交互体验

## 许可证

本项目仅供学习和研究使用。

## 联系方式

如有问题或建议，请通过相关渠道联系开发者。

---

**提示**: 使用前请确保目标页面结构符合插件的选择器要求，否则可能无法正确提取内容。
