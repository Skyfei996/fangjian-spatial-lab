# 方见 · 空间思维实验室

用于亲子数学教学的响应式 3D 方块工作台。使用 TypeScript、Three.js 和 Vite，数据保存在当前浏览器，没有账号或云端同步。

- 在线体验：[方见 · 空间思维实验室](https://skyfei996.github.io/fangjian-spatial-lab/) 。
- 公开源码：[GitHub 仓库](https://github.com/Skyfei996/fangjian-spatial-lab) 。
- 手机编辑：[浏览器代码编辑器](https://github.dev/Skyfei996/fangjian-spatial-lab) 。

## 启动

需要 Node.js 22.12 及以上版本；本版使用 Node.js 24 验证。

```powershell
npm install
npm run dev
```

打开终端显示的 Local 地址，默认是 `http://localhost:5173/`。端口已占用时以 Vite 输出为准。

手机与电脑连接同一局域网后，在手机浏览器打开 `http://<电脑局域网 IP>:5173/`。需要电脑保持运行，且网络允许访问该端口。

## 当前功能

- 自由搭建：单位正方体的添加、移除、换色、撤销与重做；内置阶梯、转角和拱门模型。
- 观察：自由旋转、缩放和平移，前、后、左、右、上、下六个标准视角；题目的前方保持固定。
- 三视图：实时生成正面、左面与上面视图；点击二维格子，关联高亮对应的立体方块。
- 动手做题：画出正面图形；增加一个方块并保持左视图不变。提供校验、提示与重新尝试。
- 一起讲解：分步观察方向、查找重叠方块、切换立体角度验证。
- 作品：手动保存到当前浏览器；导出和导入 JSON，跨设备迁移模型。
- 手机布局：底部展开工具面板、触摸旋转和缩放；添加时先点预览，再点同一处确认，移除时同样需要点选后确认。

鼠标左键拖动旋转，滚轮缩放，右键拖动平移。触摸设备单指拖动旋转，双指捏合缩放，双指拖动平移。键盘支持 `Ctrl/Cmd+Z` 撤销、`Ctrl/Cmd+Shift+Z` 重做、`Ctrl/Cmd+S` 保存。

当前支持以整数网格摆放单位正方体，搭建范围为 9 × 9，最高七层、最多 300 块。导入文件上限为 150 KB。自由搭建允许拱门、悬挑及空洞，不自动模拟重力。

## 验证

```powershell
npm run check
npm test
npm run build
```

`dist/` 为生产构建结果。几何规则与题目校验见 `src/geometry.ts`，测试位于 `tests/geometry.test.ts`。项目约束见 [AGENTS.md](AGENTS.md)，进度与后续范围见 [ROADMAP.md](ROADMAP.md)。

## GitHub Pages 发布

仓库已启用 GitHub Actions 作为 Pages 发布源。推送到 `main` 后，`.github/workflows/deploy.yml` 自动安装依赖、检查类型、运行测试、构建并发布；也可以在 [Actions](https://github.com/Skyfei996/fangjian-spatial-lab/actions) 中手动执行。发布只使用 GitHub 内置的临时授权，无须保存个人 token 到仓库。

构建会按仓库名设置资源路径，适用于 `https://<用户名>.github.io/<仓库名>/` 形式的项目站点。本地模拟该路径的命令为：

```powershell
npm run build -- --base=/fangjian-spatial-lab/
```

## 手机编程

手机浏览器可打开 [github.dev 编辑器](https://github.dev/Skyfei996/fangjian-spatial-lab) 编辑和提交文件；需要终端、测试或运行预览时，在仓库的 Code → Codespaces 中创建开发环境，也可以打开 [Codespaces 创建入口](https://codespaces.new/Skyfei996/fangjian-spatial-lab) 。本项目的 `.devcontainer/devcontainer.json` 提供 Node.js 24、自动安装依赖并转发预览端口；环境创建后运行 `npm run dev`，从端口面板打开 5173。

Codespaces 的使用受 GitHub 账号额度及计费设置限制。手机编辑后提交到 `main`，即可触发 Pages 更新。作品仍保存在各自浏览器中，发布网站不会同步模型数据。
