"""
CMakeLists.txt 解析器
解析测试文件的依赖关系
"""
from pathlib import Path
from typing import List
import re


def parse_test_dependencies(tests_cmake_path: str, test_name: str) -> List[str]:
    """
    解析测试的依赖文件
    
    Args:
        tests_cmake_path: tests/CMakeLists.txt 路径
        test_name: 测试名称 (如 test_diagramitem)
        
    Returns:
        依赖的源文件列表 (相对于 tests 目录的路径)
    """
    cmake_file = Path(tests_cmake_path)
    if not cmake_file.exists():
        return []
    
    try:
        content = cmake_file.read_text(encoding='utf-8', errors='ignore')
        
        # 查找 qt_add_executable(test_name ...) 块
        # 匹配从 qt_add_executable(test_name 到下一个 ) 之间的内容
        pattern = rf'qt_add_executable\({test_name}\s+(.*?)\)'
        match = re.search(pattern, content, re.DOTALL)
        
        if not match:
            return []
        
        files_block = match.group(1)
        
        # 提取所有 .cpp 文件
        cpp_files = re.findall(r'(\.\./[\w/]+\.cpp|[\w]+\.cpp)', files_block)
        
        # 过滤掉测试文件本身和 test_globals.cpp
        dependencies = [
            f for f in cpp_files 
            if f != f'{test_name}.cpp' and 'test_globals' not in f
        ]
        
        return dependencies
        
    except Exception as e:
        print(f"解析 CMakeLists.txt 失败: {e}")
        return []


def get_source_files_for_test(project_path: str, test_name: str) -> List[str]:
    """
    获取测试相关的所有源文件（绝对路径）
    
    Args:
        project_path: 项目路径
        test_name: 测试名称
        
    Returns:
        源文件绝对路径列表
    """
    project_dir = Path(project_path)
    tests_cmake = project_dir / "tests" / "CMakeLists.txt"
    
    # 解析依赖
    dependencies = parse_test_dependencies(str(tests_cmake), test_name)
    
    # 转换为绝对路径
    source_files = []
    for dep in dependencies:
        if dep.startswith('../'):
            # 相对于 tests 目录的路径
            file_path = project_dir / dep[3:]  # 去掉 ../
        else:
            file_path = project_dir / "tests" / dep
        
        if file_path.exists():
            source_files.append(str(file_path))
            
            # 同时添加对应的头文件
            header_path = file_path.with_suffix('.h')
            if header_path.exists():
                source_files.append(str(header_path))
    
    return source_files
