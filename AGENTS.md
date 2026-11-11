# 方见 · 空间思维实验室

面向亲子数学教学的响应式 3D 方块工作台。支持本地运行和 GitHub Pages 静态部署，作品数据保存在当前浏览器。

## 目录与边界

- `src/geometry.ts`：与界面和 Three.js 无关的整数网格模型、投影与题目校验；坐标为 x 左右、y 高度、z 前后，前方为 +z。
- `src/scene.ts`：Three.js 场景、相机、拾取与教学高亮。自由观察只移动相机，不改变题目的前方。
- `src/main.ts`、`src/style.css`：中文交互、响应式布局与本地存储。
- `tests/`：投影与题目失败路径测试。
- `.github/workflows/deploy.yml`：检查、测试、构建及 GitHub Pages 发布；推送到 `main` 时执行。
- `.devcontainer/devcontainer.json`：GitHub Codespaces 的 Node.js 开发环境与预览端口。
- `.tmp/<task-slug>/`：临时验证产物，禁止成为运行依赖。

## 工作流

先读 `ROADMAP.md`；使用、启动方式见 `README.md`。新增题型复用场景数据与投影函数，禁止将渲染截图作为方块题的判分依据。当前只支持单位正方体，其他几何体需独立设计投影能力。

## 验证

`npm run check` 检查类型，`npm test` 检查几何和判题，`npm run build` 验证生产构建。涉及交互与样式时，额外检查桌面及手机布局。
