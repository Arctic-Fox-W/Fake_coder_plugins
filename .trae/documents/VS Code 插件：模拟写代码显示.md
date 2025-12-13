## 目标与范围
- 在资源管理器中选择一个或多个文件，提供“模拟写代码”打开方式。
- 打开后编辑器初始显示为空白；用户每次按键时，从原文件真实内容中逐步显示对应部分，形成“用户在编码、代码逐步显现”的效果。
- 不修改源文件，使用 VSIX 打包安装。

## 交互流程
- 用户在资源管理器中右键所选文件，选择“模拟写代码打开”。
- 插件为每个文件启动一个模拟会话：打开一个自定义 scheme 的虚拟文档 `simwrite:`，初始为空白。
- 用户在该编辑器中输入：每次按键触发，按键数对应显示原文件的下一段内容；用户输入的实际字符被忽略或替换为原文字符。
- 支持退格回退显示进度、支持粘贴批量显示。
- 会话完成（原文已全部显示）后提示完成，可选择结束会话或继续浏览。

## 技术实现
- 使用 TypeScript 开发 VS Code 扩展。
- 自定义 `TextDocumentContentProvider` 提供 `simwrite` scheme 的虚拟文档，初始返回空内容；通过事件驱动更新文档。
- 会话状态 `SimSession`：记录 `sourceUri`、`content`（原文）、`revealPos`（已显示位置）、`applyingEdit`（防止事件循环）。
- 监听 `workspace.onDidChangeTextDocument`（仅针对 `simwrite` 文档）：根据用户编辑的插入/删除长度，替换为显示原文对应内容，并更新会话位置。
- 使用 `TextEditor.edit` 进行文本替换，结合 `applyingEdit` 标志避免无限事件循环。
- 语言高亮：读取源文件 `languageId`，用 `languages.setTextDocumentLanguage` 设置虚拟文档语言，使高亮与原文件一致。

## 命令与菜单
- `simwrite.simulateSelected`：在资源管理器右键菜单显示，支持多选（命令签名 `(uri, uris?)`，当多选时 `uris` 提供所有选中项）。
- `simwrite.simulateActive`：对当前活动编辑器文件启动模拟。
- `simwrite.stopSession`：结束当前 `simwrite` 编辑器的模拟会话，关闭虚拟文档并释放状态。
- `contributes.menus.explorer/context`：注册 `simulateSelected`。
- `contributes.menus.commandPalette` 或 `editor/title`：注册开始/结束命令便于快速操作。

## 编辑事件处理细节
- 计算本次用户修改的净字符数 `delta`：插入为正、删除为负。
- 插入（`delta > 0`）：
  - 移除用户实际插入文本（保持空白到显示的“原文”逻辑）。
  - 在光标处插入 `content.slice(revealPos, revealPos + deltaShown)`，`deltaShown` 为限制到未显示剩余长度的值。
  - 更新 `revealPos += deltaShown`；若到达末尾则提示完成。
- 删除（`delta < 0`）：
  - 删除当前文档末尾或光标前的已显示字符；回退 `revealPos`。
- 保护与边界：不越界，不对非 `simwrite` 文档做处理；避免快速输入时的闪烁，批量合并编辑。

## 多文件与会话并发
- 每个虚拟文档对应一个独立 `SimSession`，存于 `Map<Uri, SimSession>`。
- 多选文件时为每个文件启动一个会话并各自打开编辑器标签页。
- 监听 `onDidCloseTextDocument` 清理对应会话状态，防止内存泄漏。

## 设置项（可选）
- `simwrite.charactersPerKeystroke`：每次按键显示的字符数（默认 `1`）。
- `simwrite.allowBackspace`：是否允许退格回退（默认 `true`）。
- `simwrite.pasteMultiplier`：粘贴时显示倍数（默认 `1`）。
- `simwrite.showCompletionMessage`：完成显示时是否弹出提示（默认 `true`）。

## 性能与边界
- 首次读取源文件内容：`workspace.openTextDocument(sourceUri).getText()`，仅保存在内存，不写盘。
- 不拦截全局 `type` 命令，仅对 `simwrite` 文档的变更事件处理，降低侵入性。
- 适配超大文件：必要时限制最大显示速度；避免每键过多编辑导致卡顿。

## 安全与隐私
- 不修改源文件、不向外发送数据；所有状态仅存内存。
- 关闭编辑器或结束会话时清理会话状态。

## VSIX 打包与安装
- 在项目添加 `package.json` 扩展元数据：`name`、`displayName`、`publisher`、`engines.vscode`、`activationEvents`、`contributes` 等。
- 开发依赖安装 `vsce`：`npm i -D vsce`；打包命令 `vsce package` 生成 `.vsix`。
- 用户在 VS Code 扩展视图选择“从 VSIX 安装”进行安装使用。

## 验证与测试
- 用多种文件（TypeScript/Markdown/JSON）验证：逐字符显示、退格回退、粘贴批量显示、完成提示。
- 验证语言高亮与原文件一致，源文件未被修改。
- 验证多文件并发会话、关闭释放资源。
- 边界测试：空文件、只读文件、超长文件、快速输入与粘贴。

## 交付物
- `src/extension.ts`：命令注册与事件监听。
- `src/SimWriteProvider.ts`：自定义内容提供者与虚拟文档管理。
- `src/SimSession.ts`：会话状态管理。
- `package.json`：贡献点与配置项（displayName: TypeReveal，configuration.title: TypeReveal 设置）。
- `README.md`：使用说明（标题使用 TypeReveal（模拟写代码））。
- 打包好的 `.vsix` 文件。

## 下一步
- 若您确认方案，我将按上述计划创建扩展工程、实现核心逻辑、完善菜单与设置，并提供可安装的 VSIX 包。
