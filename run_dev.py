#!/usr/bin/env python3
"""
PyWebView Desktop App - 开发模式入口
自动启动 Vite 开发服务器 + PyWebView
"""
import sys
from backend.window import create_window
from backend.server import start_vite, wait_vite_ready, stop_vite
import webview

if __name__ == "__main__":
    print("🚀 启动 PyWebView 桌面应用（开发模式）")
    print("📦 正在启动 Vite 开发服务器...")
    print("-" * 60)
    
    # 启动 Vite
    vite_process = None
    try:
        vite_process = start_vite()
        
        # 等待 Vite 就绪
        if not wait_vite_ready():
            print("❌ Vite 服务器启动失败")
            sys.exit(1)
        
        print("-" * 60)
        print("✅ Vite 服务器已就绪")
        print("🌐 前端地址: http://localhost:9033")
        print("🪟 正在创建 PyWebView 窗口...")
        print("-" * 60)
        
        # 创建窗口
        window = create_window(dev=True)
        
        # 启动 WebView
        webview.start(debug=True)
        
    except KeyboardInterrupt:
        print("\n⚠️  收到中断信号，正在关闭...")
    except Exception as e:
        print(f"❌ 错误: {e}")
        sys.exit(1)
    finally:
        # 清理 Vite 进程
        if vite_process:
            stop_vite(vite_process)
        print("👋 应用已关闭")
