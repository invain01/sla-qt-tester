"""
应用配置
"""
import os
from pathlib import Path

# 项目根目录
ROOT_DIR = Path(__file__).parent.parent

# 前端目录
FRONTEND_DIR = ROOT_DIR / "frontend"
FRONTEND_DIST = FRONTEND_DIR / "dist"

# 开发配置
DEV_SERVER_URL = "http://localhost:9033"
DEV_SERVER_PORT = 9033

# 窗口配置
WINDOW_TITLE = "PyWebView Desktop App"
WINDOW_WIDTH = 1024
WINDOW_HEIGHT = 768
WINDOW_MIN_WIDTH = 800
WINDOW_MIN_HEIGHT = 600

# 是否开发模式
IS_DEV = os.getenv("DEV_MODE", "false").lower() == "true"
