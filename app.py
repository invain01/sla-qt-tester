#!/usr/bin/env python3
"""
SLA Qt Tester - 生产模式入口
加载打包后的前端文件
"""
from backend.window import start_app

if __name__ == "__main__":
    print("🚀 启动 SLA Qt Tester（生产模式）")
    print("📦 加载前端构建文件: frontend/dist/index.html")
    print("⚠️  如果找不到文件，请先运行: cd frontend && pnpm build")
    print("-" * 60)
    
    start_app(dev=False)
