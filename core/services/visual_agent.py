"""
智能视觉测试 Agent
负责实时视觉监控和自动化测试

集成视觉识别能力:
- 模板匹配 (TemplateMatcher)
- 颜色匹配 (ColorMatcher)
- 任务流水线 (Pipeline)
"""
import base64
import time
import subprocess
import os
from io import BytesIO
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, List
from core.utils.logger import logger
from dotenv import load_dotenv

try:
    import pyautogui
    import cv2
    import numpy as np
    VISUAL_LIBS_AVAILABLE = True
except ImportError:
    VISUAL_LIBS_AVAILABLE = False
    logger.warning("视觉库未安装，部分功能将不可用")

# 导入视觉识别模块
try:
    from core.vision import (
        TemplateMatcher, TemplateMatcherParam,
        ColorMatcher, ColorMatcherParam,
        Pipeline, PipelineNode,
        Rect, RecoResult
    )
    VISION_MODULE_AVAILABLE = True
except ImportError:
    VISION_MODULE_AVAILABLE = False
    logger.warning("视觉识别模块未加载")

try:
    import pygetwindow as gw
    WINDOW_LIB_AVAILABLE = True
except ImportError:
    WINDOW_LIB_AVAILABLE = False
    logger.warning("窗口管理库未安装")

try:
    from openai import OpenAI
    AI_LIB_AVAILABLE = True
except ImportError:
    AI_LIB_AVAILABLE = False
    logger.warning("OpenAI SDK 未安装，AI 功能将不可用")


class VisualAgent:
    """智能视觉测试代理"""

    def __init__(self, target_exe_path: str = None, api_key: str = None, api_base_url: str = None):
        """
        初始化视觉测试代理
        
        Args:
            target_exe_path: 被测程序路径
            api_key: AI API Key (可选，不提供则从 .env 读取)
            api_base_url: AI API Base URL
        """
        if target_exe_path:
            self.target_exe = Path(target_exe_path)
        else:
            # 默认使用 diagramscene.exe
            self.target_exe = Path(__file__).parent.parent.parent.parent / "targetcpp" / "runableexe" / "FreeCharts" / "diagramscene.exe"
        
        self.target_process = None
        self.ai_client = None
        
        # 自动从 .env 读取 API Key（如果未提供）
        if not api_key and AI_LIB_AVAILABLE:
            # 加载 .env 文件
            env_path = Path(__file__).parent.parent.parent / ".env"
            if env_path.exists():
                load_dotenv(env_path)
                api_key = os.getenv("SPARK_API_KEY")
                if api_key:
                    logger.info("已从 .env 文件读取讯飞星火 API Key")
        
        # 读取模型配置（与项目其他部分保持一致）
        if not api_base_url:
            api_base_url = os.getenv("SPARK_BASE_URL", "http://maas-api.cn-huabei-1.xf-yun.com/v1")
        
        self.ai_model = os.getenv("SPARK_MODEL", "generalv3.5")
        
        # 初始化 AI 客户端（支持讯飞星火等）
        if api_key and AI_LIB_AVAILABLE:
            try:
                # 讯飞星火 API 配置（使用与 core/ai/deepseek_client.py 相同的配置）
                self.ai_client = OpenAI(
                    api_key=api_key,
                    base_url=api_base_url,
                    timeout=60.0,  # 增加到60秒
                    max_retries=2  # 自动重试2次
                )
                logger.info(f"AI 客户端初始化成功")
                logger.info(f"API Key: {api_key[:10]}...{api_key[-10:]}")
                logger.info(f"Base URL: {api_base_url}")
                logger.info(f"Model: {self.ai_model}")
            except Exception as e:
                logger.error(f"AI 客户端初始化失败: {e}")
        else:
            if not api_key:
                logger.warning("未找到 AI API Key，AI 功能将不可用")
        
        logger.info(f"视觉测试代理初始化完成，目标程序: {self.target_exe}")

    # ==================== 应用程序控制 ====================

    def launch_target_app(self) -> Dict[str, Any]:
        """启动被测应用程序"""
        logger.info("启动被测应用程序...")
        
        if not self.target_exe.exists():
            return {
                "success": False,
                "error": f"目标程序不存在: {self.target_exe}"
            }
        
        try:
            self.target_process = subprocess.Popen([str(self.target_exe)])
            time.sleep(2)  # 等待应用启动
            
            logger.info(f"应用已启动，PID: {self.target_process.pid}")
            
            return {
                "success": True,
                "pid": self.target_process.pid,
                "path": str(self.target_exe)
            }
            
        except Exception as e:
            logger.error(f"启动应用失败: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def close_target_app(self) -> Dict[str, Any]:
        """关闭被测应用程序"""
        logger.info("关闭被测应用程序...")
        
        try:
            if self.target_process and self.target_process.poll() is None:
                self.target_process.terminate()
                self.target_process.wait(timeout=5)
                logger.info("应用已关闭")
                return {"success": True}
            else:
                return {"success": False, "error": "应用未运行"}
        except Exception as e:
            logger.error(f"关闭应用失败: {e}")
            return {"success": False, "error": str(e)}

    def get_window_info(self) -> Dict[str, Any]:
        """获取窗口信息"""
        if not WINDOW_LIB_AVAILABLE:
            return {"success": False, "error": "窗口管理库未安装"}
        
        try:
            windows = gw.getAllTitles()
            target_windows = [w for w in windows if "diagram" in w.lower() or "freecharts" in w.lower()]
            
            return {
                "success": True,
                "all_windows": windows[:10],  # 只返回前10个
                "target_windows": target_windows
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def focus_target_window(self, window_title: str = None) -> Dict[str, Any]:
        """聚焦目标窗口"""
        if not WINDOW_LIB_AVAILABLE:
            return {"success": False, "error": "窗口管理库未安装"}
        
        try:
            if window_title:
                window = gw.getWindowsWithTitle(window_title)[0]
            else:
                # 自动查找目标窗口
                windows = gw.getWindowsWithTitle("diagram")
                if not windows:
                    windows = gw.getWindowsWithTitle("FreeCharts")
                if not windows:
                    return {"success": False, "error": "未找到目标窗口"}
                window = windows[0]
            
            window.activate()
            time.sleep(0.5)
            
            return {
                "success": True,
                "window_title": window.title,
                "position": (window.left, window.top, window.width, window.height)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ==================== 实时视觉监控 ====================

    def get_screen_frame(self, region: Tuple[int, int, int, int] = None) -> Dict[str, Any]:
        """
        获取屏幕截图帧（Base64编码）
        
        Args:
            region: (x, y, width, height) 截图区域
            
        Returns:
            包含 Base64 图片的字典
        """
        if not VISUAL_LIBS_AVAILABLE:
            return {
                "success": False,
                "error": "视觉库未安装"
            }
        
        try:
            # 截取屏幕
            if region:
                screenshot = pyautogui.screenshot(region=region)
            else:
                screenshot = pyautogui.screenshot()
            
            # 转换为 Base64
            buffer = BytesIO()
            screenshot.save(buffer, format='PNG')
            img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            return {
                "success": True,
                "image": f"data:image/png;base64,{img_base64}",
                "width": screenshot.width,
                "height": screenshot.height
            }
            
        except Exception as e:
            logger.error(f"截屏失败: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    # ==================== AI 自动化测试 ====================

    def run_stress_test(self, iterations: int = 10) -> Dict[str, Any]:
        """
        运行折线算法压力测试
        
        Args:
            iterations: 测试迭代次数
            
        Returns:
            测试结果
        """
        if not VISUAL_LIBS_AVAILABLE:
            return {"success": False, "error": "视觉库未安装"}
        
        logger.info(f"开始压力测试，迭代次数: {iterations}")
        
        results = {
            "success": True,
            "total_iterations": iterations,
            "successful": 0,
            "failed": 0,
            "logs": []
        }
        
        try:
            # 获取屏幕中心区域
            screen_width, screen_height = pyautogui.size()
            center_x, center_y = screen_width // 2, screen_height // 2
            
            for i in range(iterations):
                try:
                    # 生成随机坐标
                    import random
                    x1 = center_x + random.randint(-200, 200)
                    y1 = center_y + random.randint(-200, 200)
                    x2 = center_x + random.randint(-200, 200)
                    y2 = center_y + random.randint(-200, 200)
                    
                    # 模拟拖拽连线
                    pyautogui.moveTo(x1, y1, duration=0.2)
                    pyautogui.click()
                    time.sleep(0.1)
                    pyautogui.dragTo(x2, y2, duration=0.3)
                    
                    results["successful"] += 1
                    results["logs"].append(f"迭代 {i+1}: 成功 ({x1},{y1}) -> ({x2},{y2})")
                    
                except Exception as e:
                    results["failed"] += 1
                    results["logs"].append(f"迭代 {i+1}: 失败 - {str(e)}")
                
                time.sleep(0.2)
            
            logger.info(f"压力测试完成: {results['successful']}/{iterations} 成功")
            
        except Exception as e:
            results["success"] = False
            results["error"] = str(e)
        
        return results

    def execute_ai_command(self, natural_language: str) -> Dict[str, Any]:
        """
        执行自然语言驱动的测试指令
        
        Args:
            natural_language: 自然语言指令，如 "画一个红色的矩形"
            
        Returns:
            执行结果
        """
        if not self.ai_client:
            return {
                "success": False,
                "error": "AI 客户端未初始化，请提供 API Key"
            }
        
        logger.info(f"执行 AI 指令: {natural_language}")
        
        try:
            # 调用 AI API 解析指令（支持讯飞星火等）
            logger.info("正在调用讯飞星火 API...")
            
            response = self.ai_client.chat.completions.create(
                model=self.ai_model,  # 使用配置的模型
                messages=[
                    {
                        "role": "system",
                        "content": "你是一个流程图编辑器自动化测试助手。用户会用自然语言描述操作，你需要将其转换为具体的鼠标操作指令。返回 JSON 格式，包含 action（如 'draw_rect', 'draw_circle', 'draw_line'）和参数（如坐标、颜色等）。"
                    },
                    {
                        "role": "user",
                        "content": natural_language
                    }
                ],
                temperature=0.3,
                max_tokens=500,
                stream=False  # 显式禁用流式输出
            )
            
            ai_response = response.choices[0].message.content
            logger.info(f"AI 响应成功: {ai_response}")
            
            # 这里应该解析 AI 响应并执行相应操作
            # 简化版本：直接返回 AI 的理解
            return {
                "success": True,
                "command": natural_language,
                "ai_interpretation": ai_response,
                "executed": False,
                "message": "AI 指令解析完成，实际执行功能待实现"
            }
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"AI 指令执行失败: {error_msg}")
            
            # 提供更友好的错误提示
            if "401" in error_msg or "HMAC" in error_msg:
                error_msg = "API Key 认证失败，请检查：\n1. API Key 是否正确\n2. 是否为讯飞星火的有效密钥\n3. 账户是否有余额"
            elif "timeout" in error_msg.lower():
                error_msg = "API 调用超时，请检查网络连接或稍后重试"
            
            return {
                "success": False,
                "error": error_msg,
                "detail": str(e)
            }

    def verify_visual_result(self, expected_pattern: str) -> Dict[str, Any]:
        """
        使用 OpenCV 验证视觉结果
        
        Args:
            expected_pattern: 期望的视觉模式（如 "line", "rectangle"）
            
        Returns:
            验证结果
        """
        if not VISUAL_LIBS_AVAILABLE:
            return {"success": False, "error": "视觉库未安装"}
        
        logger.info(f"验证视觉结果: {expected_pattern}")
        
        try:
            # 截取当前屏幕
            screenshot = pyautogui.screenshot()
            img_array = np.array(screenshot)
            img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            
            # 简单的边缘检测
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, 50, 150)
            
            # 统计边缘像素
            edge_pixels = np.sum(edges > 0)
            total_pixels = edges.size
            edge_ratio = edge_pixels / total_pixels
            
            return {
                "success": True,
                "pattern": expected_pattern,
                "edge_ratio": round(float(edge_ratio), 4),  # 转换为 Python float
                "verified": bool(edge_ratio > 0.01),  # 转换为 Python bool
                "message": "检测到图形元素" if edge_ratio > 0.01 else "未检测到明显图形"
            }
            
        except Exception as e:
            logger.error(f"视觉验证失败: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    # ==================== MAA 风格视觉识别 ====================

    def _capture_screen_cv(self, region: Tuple[int, int, int, int] = None) -> np.ndarray:
        """截取屏幕并转换为 OpenCV 格式 (BGR)"""
        if region:
            screenshot = pyautogui.screenshot(region=region)
        else:
            screenshot = pyautogui.screenshot()
        return cv2.cvtColor(np.array(screenshot), cv2.COLOR_RGB2BGR)

    def find_template(
        self,
        template_path: str,
        threshold: float = 0.7,
        roi: List[int] = None
    ) -> Dict[str, Any]:
        """
        模板匹配 - 在屏幕上查找模板图片
        
        Args:
            template_path: 模板图片路径
            threshold: 匹配阈值 (0-1)
            roi: 搜索区域 [x, y, width, height]
            
        Returns:
            匹配结果，包含位置和分数
        """
        if not VISUAL_LIBS_AVAILABLE or not VISION_MODULE_AVAILABLE:
            return {"success": False, "error": "视觉模块未安装"}
        
        logger.info(f"模板匹配: {template_path}, 阈值: {threshold}")
        
        try:
            # 截取屏幕
            image = self._capture_screen_cv()
            
            # 构建 ROI
            roi_rect = Rect.from_list(roi) if roi else None
            
            # 执行模板匹配
            param = TemplateMatcherParam(
                templates=[template_path],
                thresholds=[threshold]
            )
            matcher = TemplateMatcher(image, param, roi_rect)
            result = matcher.analyze()
            
            return {
                "success": result.success,
                "algorithm": "TemplateMatch",
                "cost_ms": result.cost_ms,
                "box": result.box.to_dict() if result.box else None,
                "score": result.score,
                "all_count": len(result.all_results),
                "filtered_count": len(result.filtered_results)
            }
            
        except Exception as e:
            logger.error(f"模板匹配失败: {e}")
            return {"success": False, "error": str(e)}

    def find_color(
        self,
        lower: List[int],
        upper: List[int],
        roi: List[int] = None,
        color_space: str = "HSV",
        min_count: int = 100
    ) -> Dict[str, Any]:
        """
        颜色匹配 - 在屏幕上查找指定颜色
        
        Args:
            lower: 颜色下限 (如 HSV: [0, 100, 100])
            upper: 颜色上限 (如 HSV: [10, 255, 255])
            roi: 搜索区域 [x, y, width, height]
            color_space: 颜色空间 ("HSV" | "RGB" | "BGR")
            min_count: 最少像素数
            
        Returns:
            匹配结果
        """
        if not VISUAL_LIBS_AVAILABLE or not VISION_MODULE_AVAILABLE:
            return {"success": False, "error": "视觉模块未安装"}
        
        logger.info(f"颜色匹配: {lower} - {upper}, 颜色空间: {color_space}")
        
        try:
            # 截取屏幕
            image = self._capture_screen_cv()
            
            # 构建 ROI
            roi_rect = Rect.from_list(roi) if roi else None
            
            # 颜色空间转换方法
            method_map = {
                "HSV": cv2.COLOR_BGR2HSV,
                "RGB": cv2.COLOR_BGR2RGB,
                "BGR": 0,  # 不转换
            }
            method = method_map.get(color_space.upper(), cv2.COLOR_BGR2HSV)
            
            # 执行颜色匹配
            param = ColorMatcherParam(
                ranges=[(lower, upper)],
                method=method,
                count=min_count
            )
            matcher = ColorMatcher(image, param, roi_rect)
            result = matcher.analyze()
            
            return {
                "success": result.success,
                "algorithm": "ColorMatch",
                "cost_ms": result.cost_ms,
                "box": result.box.to_dict() if result.box else None,
                "pixel_count": int(result.score) if result.score else 0,
                "all_count": len(result.all_results),
                "filtered_count": len(result.filtered_results)
            }
            
        except Exception as e:
            logger.error(f"颜色匹配失败: {e}")
            return {"success": False, "error": str(e)}

    def click_template(
        self,
        template_path: str,
        threshold: float = 0.7,
        roi: List[int] = None,
        offset: List[int] = None
    ) -> Dict[str, Any]:
        """
        找图并点击 - 查找模板并点击其中心
        
        Args:
            template_path: 模板图片路径
            threshold: 匹配阈值
            roi: 搜索区域
            offset: 点击偏移 [x, y]
            
        Returns:
            操作结果
        """
        if not VISUAL_LIBS_AVAILABLE or not VISION_MODULE_AVAILABLE:
            return {"success": False, "error": "视觉模块未安装"}
        
        logger.info(f"找图点击: {template_path}")
        
        try:
            # 先查找模板
            find_result = self.find_template(template_path, threshold, roi)
            
            if not find_result.get("success"):
                return {
                    "success": False,
                    "error": "未找到目标",
                    "find_result": find_result
                }
            
            # 计算点击位置
            box = find_result["box"]
            click_x = box["x"] + box["width"] // 2
            click_y = box["y"] + box["height"] // 2
            
            if offset:
                click_x += offset[0]
                click_y += offset[1]
            
            # 执行点击
            pyautogui.click(click_x, click_y)
            logger.info(f"点击位置: ({click_x}, {click_y})")
            
            return {
                "success": True,
                "action": "click",
                "position": {"x": click_x, "y": click_y},
                "find_result": find_result
            }
            
        except Exception as e:
            logger.error(f"找图点击失败: {e}")
            return {"success": False, "error": str(e)}

    def run_pipeline(
        self,
        config: Dict[str, Any],
        entry: str,
        resource_dir: str = None
    ) -> Dict[str, Any]:
        """
        运行视觉测试流水线
        
        Args:
            config: Pipeline 配置 (JSON 格式的字典)
            entry: 入口节点名
            resource_dir: 资源目录（模板图片等）
            
        Returns:
            执行结果
            
        示例 config:
        {
            "开始": {
                "recognition": "TemplateMatch",
                "template": ["button.png"],
                "threshold": [0.8],
                "action": "Click",
                "next": ["下一步"]
            }
        }
        """
        if not VISUAL_LIBS_AVAILABLE or not VISION_MODULE_AVAILABLE:
            return {"success": False, "error": "视觉模块未安装"}
        
        logger.info(f"运行 Pipeline: 入口 = {entry}")
        
        try:
            # 创建 Pipeline
            pipeline = Pipeline(
                screen_capture_func=self._capture_screen_cv,
                resource_dir=resource_dir
            )
            
            # 加载配置
            pipeline.load_from_dict(config)
            
            # 运行
            result = pipeline.run(entry)
            
            return result.to_dict()
            
        except Exception as e:
            logger.error(f"Pipeline 执行失败: {e}")
            return {"success": False, "error": str(e)}

    def run_pipeline_from_file(
        self,
        json_path: str,
        entry: str,
        resource_dir: str = None
    ) -> Dict[str, Any]:
        """
        从 JSON 文件运行 Pipeline
        
        Args:
            json_path: Pipeline 配置文件路径
            entry: 入口节点名
            resource_dir: 资源目录
        """
        if not VISUAL_LIBS_AVAILABLE or not VISION_MODULE_AVAILABLE:
            return {"success": False, "error": "视觉模块未安装"}
        
        logger.info(f"从文件运行 Pipeline: {json_path}, 入口 = {entry}")
        
        try:
            import json
            with open(json_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            return self.run_pipeline(config, entry, resource_dir)
            
        except FileNotFoundError:
            return {"success": False, "error": f"配置文件不存在: {json_path}"}
        except json.JSONDecodeError as e:
            return {"success": False, "error": f"JSON 解析错误: {e}"}
        except Exception as e:
            logger.error(f"Pipeline 执行失败: {e}")
            return {"success": False, "error": str(e)}

    def wait_for_template(
        self,
        template_path: str,
        threshold: float = 0.7,
        timeout: int = 10000,
        interval: int = 500,
        roi: List[int] = None
    ) -> Dict[str, Any]:
        """
        等待模板出现
        
        Args:
            template_path: 模板图片路径
            threshold: 匹配阈值
            timeout: 超时时间 (ms)
            interval: 检测间隔 (ms)
            roi: 搜索区域
            
        Returns:
            是否找到以及位置
        """
        if not VISUAL_LIBS_AVAILABLE or not VISION_MODULE_AVAILABLE:
            return {"success": False, "error": "视觉模块未安装"}
        
        logger.info(f"等待模板: {template_path}, 超时: {timeout}ms")
        
        start_time = time.time()
        elapsed = 0
        
        while elapsed < timeout:
            result = self.find_template(template_path, threshold, roi)
            
            if result.get("success"):
                logger.info(f"模板已出现，耗时: {elapsed}ms")
                return {
                    "success": True,
                    "elapsed_ms": elapsed,
                    "find_result": result
                }
            
            time.sleep(interval / 1000)
            elapsed = int((time.time() - start_time) * 1000)
        
        logger.info(f"等待超时: {timeout}ms")
        return {
            "success": False,
            "error": "等待超时",
            "elapsed_ms": elapsed
        }

    def get_vision_capabilities(self) -> Dict[str, Any]:
        """获取视觉识别能力信息"""
        return {
            "visual_libs_available": VISUAL_LIBS_AVAILABLE,
            "vision_module_available": VISION_MODULE_AVAILABLE,
            "capabilities": [
                "template_match",      # 模板匹配
                "color_match",         # 颜色匹配
                "click_template",      # 找图点击
                "wait_for_template",   # 等待模板
                "pipeline",            # 任务流水线
            ] if VISION_MODULE_AVAILABLE else [],
            "description": "MAA 风格视觉识别系统"
        }

    def generate_pipeline_json(self, prompt: str, test_name: str = None) -> Dict[str, Any]:
        """
        根据自然语言提示词生成Pipeline JSON配置文件
        
        Args:
            prompt: 用户输入的自然语言测试描述
            test_name: 测试名称（可选，用于生成文件名）
            
        Returns:
            生成结果，包含文件路径和内容
        """
        import json
        from datetime import datetime
        
        if not self.ai_client:
            return {
                "success": False,
                "error": "AI 客户端未初始化，请配置 SPARK_API_KEY"
            }
        
        logger.info(f"生成 Pipeline JSON: {prompt}")
        
        try:
            # 构建系统提示词 - 基于 PIPELINE_USER_GUIDE.md 的详细格式
            system_prompt = """你是一个视觉自动化测试专家。用户会用自然语言描述测试场景，你需要将其转换为可执行的 Pipeline JSON 配置。

## Pipeline JSON 格式规范

### 基本结构
```json
{
    "$comment": "测试描述（可选注释）",
    "$resource_base": "../resources/freecharts",
    
    "节点名称": {
        "recognition": "识别类型",
        "action": "动作类型",
        "next": ["下一个节点"]
    }
}
```

### 识别类型（recognition）

1. **DirectHit** - 直接命中，不做图像识别，用于固定坐标操作或流程控制
   ```json
   {
       "recognition": "DirectHit",
       "action": "Click",
       "target": [500, 300]
   }
   ```

2. **TemplateMatch** - 模板匹配（推荐用于找图点击）
   ```json
   {
       "recognition": "TemplateMatch",
       "template": ["icons/button.png"],
       "threshold": [0.2],
       "roi": [0, 100, 220, 700],
       "multi_scale": false,
       "action": "Click",
       "target": true
   }
   ```
   - template: 模板图片路径列表
   - threshold: 匹配阈值，0.2较宽松，不要超过0.3
   - roi: 搜索区域 [x, y, width, height]
   - multi_scale: 是否多尺度匹配，建议false
   - target: true表示点击识别位置

3. **ColorMatch** - 颜色匹配
   ```json
   {
       "recognition": "ColorMatch",
       "lower": [0, 100, 100],
       "upper": [10, 255, 255],
       "count": 100,
       "connected": true,
       "action": "Click",
       "target": true
   }
   ```
   - lower/upper: HSV颜色范围
   - count: 最少像素数
   - connected: 只返回连通区域

### 动作类型（action）

1. **DoNothing** - 不执行动作，仅识别
2. **Click** - 点击
   - target: true（点击识别位置）或 [x, y]（固定坐标）
   - target_offset: [x, y, 0, 0] 偏移量
3. **Swipe** - 滑动
   - begin: true 或 [x, y]
   - end: [x, y]
   - duration: 滑动时长(ms)
4. **InputText** - 输入文本
   - input_text: "要输入的文本"
5. **Wait** - 等待
   - duration: 等待时长(ms)
6. **LongPress** - 长按
   - duration: 长按时长(ms)

### 通用参数
- next: ["下一节点"] - 后续节点列表
- pre_delay: 200 - 动作前延迟(ms)
- post_delay: 500 - 动作后延迟(ms)
- timeout: 20000 - 超时时间(ms)
- roi: [x, y, w, h] - 识别区域
- enabled: true/false - 是否启用

### 常用ROI参考（FreeCharts编辑器）
- 工具箱区域: [0, 100, 220, 700]
- 画布区域: [220, 100, 1200, 800]
- 全屏: null 或不设置

## 生成要求

1. **必须生成可执行的配置**：
   - 对于需要点击的操作，使用具体坐标或模板匹配
   - 模板路径使用占位符如 "templates/xxx.png"，用户需替换为实际路径
   
2. **合理的流程设计**：
   - 第一个节点通常是 "开始测试"，用 DirectHit + DoNothing 初始化
   - 每个操作节点都要有 pre_delay 和 post_delay
   - 最后一个节点的 next 为空数组 []

3. **参数设置**：
   - threshold 建议使用 [0.2]
   - multi_scale 建议设为 false
   - 为操作添加适当的延迟

## 输出示例

```json
{
    "$comment": "在画布上绘制矩形的测试",
    "开始测试": {
        "recognition": "DirectHit",
        "action": "DoNothing",
        "pre_delay": 1000,
        "next": ["选择矩形工具"]
    },
    "选择矩形工具": {
        "recognition": "TemplateMatch",
        "template": ["templates/rect_tool.png"],
        "threshold": [0.2],
        "roi": [0, 100, 220, 700],
        "multi_scale": false,
        "action": "Click",
        "target": true,
        "pre_delay": 300,
        "post_delay": 500,
        "next": ["在画布点击放置"]
    },
    "在画布点击放置": {
        "recognition": "DirectHit",
        "action": "Click",
        "target": [600, 400],
        "pre_delay": 200,
        "post_delay": 500,
        "next": ["验证放置成功"]
    },
    "验证放置成功": {
        "recognition": "TemplateMatch",
        "template": ["templates/rect_on_canvas.png"],
        "threshold": [0.2],
        "roi": [220, 100, 1200, 800],
        "multi_scale": false,
        "action": "DoNothing",
        "next": []
    }
}
```

请根据用户描述生成完整可执行的 Pipeline JSON。只返回 JSON，不要有其他文字说明。"""

            # 调用 AI API
            logger.info("正在调用 AI 生成 Pipeline...")
            
            response = self.ai_client.chat.completions.create(
                model=self.ai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"请根据以下测试需求生成 Pipeline JSON 配置：\n\n{prompt}"}
                ],
                temperature=0.3,
                max_tokens=2000,
                stream=False
            )
            
            ai_response = response.choices[0].message.content
            logger.info(f"AI 响应: {ai_response}")
            
            # 尝试解析 JSON（处理可能的 markdown 代码块）
            json_content = ai_response.strip()
            if json_content.startswith("```"):
                # 移除 markdown 代码块标记
                lines = json_content.split("\n")
                json_lines = []
                in_json = False
                for line in lines:
                    if line.startswith("```json") or line.startswith("```"):
                        in_json = not in_json
                        continue
                    if in_json or (not line.startswith("```")):
                        json_lines.append(line)
                json_content = "\n".join(json_lines).strip()
            
            # 验证 JSON 格式
            try:
                pipeline_config = json.loads(json_content)
            except json.JSONDecodeError as e:
                logger.error(f"AI 返回的 JSON 格式错误: {e}")
                return {
                    "success": False,
                    "error": f"AI 返回的 JSON 格式错误: {e}",
                    "raw_response": ai_response
                }
            
            # 生成文件名
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            if test_name:
                # 清理文件名中的非法字符
                safe_name = "".join(c if c.isalnum() or c in "_-" else "_" for c in test_name)
                filename = f"ai_pipeline_{safe_name}_{timestamp}.json"
            else:
                filename = f"ai_pipeline_{timestamp}.json"
            
            # 保存到 log 目录
            log_dir = Path(__file__).parent.parent.parent / "log"
            log_dir.mkdir(exist_ok=True)
            file_path = log_dir / filename
            
            # 写入文件
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(pipeline_config, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Pipeline JSON 已保存: {file_path}")
            
            # 获取入口节点（第一个键）
            entry_nodes = list(pipeline_config.keys())
            
            return {
                "success": True,
                "file_path": str(file_path),
                "filename": filename,
                "prompt": prompt,
                "pipeline_config": pipeline_config,
                "entry_nodes": entry_nodes,
                "node_count": len(pipeline_config),
                "message": f"Pipeline JSON 已生成并保存到 {filename}"
            }
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"生成 Pipeline JSON 失败: {error_msg}")
            
            # 提供更友好的错误提示
            if "401" in error_msg or "HMAC" in error_msg:
                error_msg = "API Key 认证失败，请检查 SPARK_API_KEY 配置"
            elif "timeout" in error_msg.lower():
                error_msg = "API 调用超时，请检查网络连接"
            
            return {
                "success": False,
                "error": error_msg
            }

