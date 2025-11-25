"""
日志工具
"""
import logging
from datetime import datetime


def setup_logger(name: str = "app", level: int = logging.INFO) -> logging.Logger:
    """配置日志器"""
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # 控制台处理器
    handler = logging.StreamHandler()
    handler.setLevel(level)

    # 格式化
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    handler.setFormatter(formatter)

    logger.addHandler(handler)
    return logger


# 全局日志器
logger = setup_logger()
