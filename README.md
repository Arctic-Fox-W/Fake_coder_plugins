# TypeReveal（模拟写代码）

一个 VS Code 扩展：为任意文件打开“模拟写代码”会话，编辑器初始为空白；您的每次按键会按配置逐步显示源文件真实内容，形成“编码现场”的渐进呈现效果。源文件不会被修改，虚拟文档使用与源文件一致的语言高亮。

## 状态徽章

![License MIT](https://img.shields.io/badge/license-MIT-%234c1)
![VS Code ^1.85.0](https://img.shields.io/badge/VS%20Code-%5E1.85.0-00aaff)
![Node >=20](https://img.shields.io/badge/node-%E2%89%A520.0-68a063)
![TypeScript 5.5](https://img.shields.io/badge/TypeScript-5.5-3178c6)
![Package with vsce](https://img.shields.io/badge/package-vsce-ff6f00)

## 特性

- 逐字/逐段显示，可配置每次按键显示数量
- 支持退格回退显示进度
- 支持粘贴批量显示（可配置倍数）
- 多文件并发会话，标签页独立
- 完成时可提示信息
- 不修改源文件，仅在内存中操作

## 安装

- VSIX 安装
  - 在项目根目录执行 `npm install` 安装依赖
  - 运行 `npm run package` 生成 `.vsix` 包
  - 在 VS Code 扩展视图选择“从 VSIX 安装”
- 开发调试
  - 执行 `npm install` 后，在 VS Code 中打开本项目
  - 运行扩展调试（按 F5 或使用“运行和调试”）
  - 如需预构建，执行 `npm run compile`

## 使用

- 在资源管理器中选择文件，右键“模拟写代码打开（资源管理器）”
- 或在命令面板执行“模拟写代码打开（当前文件）”
- 打开的编辑器初始为空白；每次按键会从原文件逐步显示相应内容
- 源文件不被修改；虚拟文档使用与源文件一致的语法高亮
- 使用“结束模拟写代码会话”可关闭当前模拟
- 支持多选文件为每个文件启动独立会话

## 命令

- `simwrite.simulateSelected`：模拟写代码打开（资源管理器）
- `simwrite.simulateActive`：模拟写代码打开（当前文件）
- `simwrite.stopSession`：结束模拟写代码会话

## 设置

- `simwrite.charactersPerKeystroke`：每次按键显示字符数，默认 1
- `simwrite.allowBackspace`：允许退格回退，默认 true
- `simwrite.pasteMultiplier`：粘贴显示倍数，默认 1
- `simwrite.showCompletionMessage`：完成时提示，默认 true

## 进阶说明

- 虚拟文档在内存创建，并根据您的输入事件替换为源文件前缀内容
- 插入、删除与粘贴分别计算增减量以推动显示进度
- 会话完成后可提示“已全部显示”，您可继续浏览或关闭标签页
- 关闭编辑器会自动释放会话状态，避免资源泄漏

## 目录结构

- `src/extension.ts`：命令注册、编辑事件拦截与会话管理
- `src/SimWriteProvider.ts`：虚拟文档创建与会话存储
- `src/SimSession.ts`：会话状态（源文件语言、内容、位置等）
- `package.json`：扩展贡献点、配置项、脚本

## 常见问题

- 正常编辑行为：在非模拟文档中，输入/删除/粘贴均回退到 VS Code 默认行为
- 只读文件：源文件只用于读取，不会被写入
- 性能：对超长文件建议适当降低每次按键显示数量或粘贴倍数

## 统计与图表

![Star History](https://api.star-history.com/svg?repos=Arctic-Fox-W/Fake_coder_plugins&type=Date)

[![Repo Card](https://github-readme-stats.vercel.app/api/pin/?username=Arctic-Fox-W&repo=fake_ide)](https://github.com/Arctic-Fox-W/fake_ide)
[![Repo Card](https://github-readme-stats.vercel.app/api/pin/?username=Arctic-Fox-W&repo=Fake_coder_plugins)](https://github.com/Arctic-Fox-W/Fake_coder_plugins)

## 相关链接

- [Fake IDE](https://github.com/Arctic-Fox-W/Fake_IDE)：基于浏览器的轻量“假”IDE，集成 Monaco Editor 的只读展示与逐字揭示，直接模拟完整 IDE 界面实现“模拟写代码”效果，适合影视演出、直播展示与教学场景。

## 许可证

- 本项目采用 MIT 许可证，详见 `LICENSE`
