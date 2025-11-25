# SLA Qt Tester

🚀 **SLA Qt Tester** - Qt 可视化测试工具

## 🚀 快速开始

### 1️⃣ 安装依赖

```bash
# 安装 Python 依赖（使用 uv）
uv venv
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\activate   # Windows
uv pip install -r requirements.txt

# 安装前端依赖
cd frontend && pnpm i && cd ..
```

### 2️⃣ 启动开发

```bash
python run_dev.py
```

自动启动 Vite（端口 9033）+ PyWebView 窗口

### 3️⃣ 生产构建

```bash
cd frontend && pnpm build && cd ..
python app.py
```

## 📁 项目结构

```
├── core/              # 核心业务逻辑（纯 Python）
├── backend/           # PyWebView + JS Bridge
├── frontend/          # Vite + React 前端
├── app.py            # 生产入口
└── run_dev.py        # 开发入口
```

## 🔧 技术栈

**前端**: Vite + React 19 + TypeScript + TailwindCSS 4  
**后端**: Python 3.10+ + PyWebView 5.0+

## 🎨 自定义开发

### 添加新 API

1. `core/` 实现业务逻辑
2. `backend/api.py` 暴露方法
3. `frontend/src/api/py.ts` 添加类型
4. 前端调用

> 请注意，接口过多时要有软件工程组织，建议按功能模块分组管理，避免全部堆积在单一文件中！

### 修改配置

`backend/config.py`:
```python
WINDOW_TITLE = "My App"
WINDOW_WIDTH = 1280
DEV_SERVER_PORT = 9033  # 开发端口
```

`frontend/vite.config.ts` 中的 `server.port` 也需要保持一致。

## 📦 打包部署

```bash
uv pip install pyinstaller

# 先构建前端
cd frontend && pnpm build && cd ..

# 打包应用
pyinstaller --name="PyWebViewApp" \
  --windowed \
  --add-data="frontend/dist:frontend/dist" \
  --hidden-import=webview \
  app.py

# 输出在 dist/PyWebViewApp.app (macOS)
```

## 📖 相关链接

[PyWebView](https://pywebview.flowrl.com/) · [Vite](https://vitejs.dev/) · [React](https://react.dev/)