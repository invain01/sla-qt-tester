"""
UI 测试运行器
运行 UI 测试并收集截图
"""
import subprocess
import re
from pathlib import Path
from typing import List, Optional
from dataclasses import dataclass, asdict
from core.utils.logger import logger


@dataclass
class UITestScreenshot:
    """UI 测试截图信息"""
    step_number: int
    step_name: str
    file_path: str
    
    def to_dict(self):
        return asdict(self)


@dataclass
class UITestResult:
    """UI 测试结果"""
    test_name: str
    status: str  # 'passed' | 'failed' | 'error'
    total: int
    passed: int
    failed: int
    skipped: int
    duration: str
    output: str
    screenshots: List[UITestScreenshot]  # 截图列表
    details: List = None  # 测试用例详情（UI 测试通常没有详细用例）
    
    def to_dict(self):
        return {
            'test_name': self.test_name,
            'status': self.status,
            'total': self.total,
            'passed': self.passed,
            'failed': self.failed,
            'skipped': self.skipped,
            'duration': self.duration,
            'output': self.output,
            'screenshots': [s.to_dict() for s in self.screenshots],
            'details': self.details or []
        }


def run_ui_test(executable_path: str, test_name: str, project_dir: str) -> UITestResult:
    """
    运行 UI 测试并收集截图
    
    Args:
        executable_path: 测试可执行文件路径
        test_name: 测试名称
        project_dir: 项目目录（用于查找截图）
        
    Returns:
        UI 测试结果（含截图路径）
    """
    logger.info(f"运行 UI 测试: {test_name}")
    
    try:
        # 运行测试（设置工作目录为项目目录）
        result = subprocess.run(
            [executable_path],
            capture_output=True,
            text=True,
            timeout=60,
            cwd=project_dir  # 关键：设置工作目录
        )
        
        output = result.stdout + result.stderr
        logger.debug(f"测试输出:\n{output}")
        
        # 解析测试结果
        total, passed, failed, skipped = _parse_test_counts(output)
        duration = _parse_duration(output)
        
        # 确定状态
        if result.returncode == 0 and failed == 0:
            status = 'passed'
        elif failed > 0:
            status = 'failed'
        else:
            status = 'error'
        
        # 收集截图
        screenshots = _collect_screenshots(project_dir)
        logger.info(f"收集到 {len(screenshots)} 张截图")
        
        return UITestResult(
            test_name=test_name,
            status=status,
            total=total,
            passed=passed,
            failed=failed,
            skipped=skipped,
            duration=duration,
            output=output,
            screenshots=screenshots
        )
        
    except subprocess.TimeoutExpired:
        logger.error(f"测试超时: {test_name}")
        return UITestResult(
            test_name=test_name,
            status='error',
            total=0,
            passed=0,
            failed=0,
            skipped=0,
            duration='timeout',
            output='测试执行超时',
            screenshots=[]
        )
    except Exception as e:
        logger.error(f"运行测试失败: {e}")
        return UITestResult(
            test_name=test_name,
            status='error',
            total=0,
            passed=0,
            failed=0,
            skipped=0,
            duration='0ms',
            output=f'错误: {str(e)}',
            screenshots=[]
        )


def _parse_test_counts(output: str) -> tuple:
    """解析测试数量"""
    total = passed = failed = skipped = 0
    
    # 匹配 "Totals: X passed, Y failed, Z skipped"
    totals_match = re.search(r'Totals:\s*(\d+)\s*passed,\s*(\d+)\s*failed,\s*(\d+)\s*skipped', output)
    if totals_match:
        passed = int(totals_match.group(1))
        failed = int(totals_match.group(2))
        skipped = int(totals_match.group(3))
        total = passed + failed + skipped
    
    return total, passed, failed, skipped


def _parse_duration(output: str) -> str:
    """解析测试耗时"""
    # 匹配 "Finished in Xms"
    duration_match = re.search(r'Finished in\s+(\d+(?:\.\d+)?)\s*ms', output)
    if duration_match:
        return f"{duration_match.group(1)}ms"
    return "0ms"


def _collect_screenshots(project_dir: str) -> List[UITestScreenshot]:
    """
    收集测试截图
    
    Args:
        project_dir: 项目目录
        
    Returns:
        截图列表
    """
    screenshots = []
    screenshot_dir = Path(project_dir) / ".test_screenshots"
    
    if not screenshot_dir.exists():
        logger.warning(f"截图目录不存在: {screenshot_dir}")
        return screenshots
    
    # 扫描所有 step_*.png 文件
    for png_file in sorted(screenshot_dir.glob("step_*.png")):
        # 解析文件名: step_01_initial_empty.png
        match = re.match(r'step_(\d+)_(.+)\.png', png_file.name)
        if match:
            step_number = int(match.group(1))
            step_name = match.group(2)
            
            screenshots.append(UITestScreenshot(
                step_number=step_number,
                step_name=step_name,
                file_path=str(png_file)
            ))
            logger.debug(f"找到截图: {png_file.name}")
    
    return screenshots
