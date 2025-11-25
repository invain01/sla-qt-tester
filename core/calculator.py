"""
计算器核心逻辑
纯函数，可测试，可复用
"""


def add(a: int | float, b: int | float) -> int | float:
    """加法运算"""
    return a + b


def subtract(a: int | float, b: int | float) -> int | float:
    """减法运算"""
    return a - b


def multiply(a: int | float, b: int | float) -> int | float:
    """乘法运算"""
    return a * b


def divide(a: int | float, b: int | float) -> float:
    """除法运算"""
    if b == 0:
        raise ValueError("除数不能为零")
    return a / b


def power(a: int | float, b: int | float) -> int | float:
    """幂运算"""
    return a ** b
