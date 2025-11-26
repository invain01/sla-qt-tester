"""
DeepSeek AI 客户端
用于分析单元测试失败原因
"""
import os
from openai import OpenAI
from dotenv import load_dotenv
from core.utils.logger import logger

# 加载环境变量
load_dotenv()


class DeepSeekClient:
    """DeepSeek AI 客户端"""
    
    def __init__(self):
        api_key = os.getenv('DEEPSEEK_API_KEY')
        if not api_key:
            logger.warning("未配置 DEEPSEEK_API_KEY，AI 分析功能将不可用")
            self.client = None
        else:
            self.client = OpenAI(
                api_key=api_key,
                base_url="https://api.deepseek.com"
            )
    
    def is_available(self) -> bool:
        """检查 AI 服务是否可用"""
        return self.client is not None
    
    def analyze_test_failure(
        self,
        test_name: str,
        test_code: str,
        source_code: dict,
        failure_details: str
    ) -> str:
        """
        分析测试失败原因
        
        Args:
            test_name: 测试名称
            test_code: 测试代码
            source_code: 被测源代码 {文件名: 代码内容}
            failure_details: 失败详情
            
        Returns:
            AI 分析结果
        """
        if not self.is_available():
            return "AI 分析服务不可用，请配置 DEEPSEEK_API_KEY"
        
        # 构建上下文
        source_context = "\n\n".join([
            f"=== {filename} ===\n{code}"
            for filename, code in source_code.items()
        ])
        
        # 构建提示词
        prompt = f"""你是一个 C++ 和 Qt 测试专家。请分析以下单元测试失败的原因。

## 测试信息
测试名称：{test_name}

## 失败详情
{failure_details}

## 测试代码
```cpp
{test_code}
```

## 被测源代码
{source_context}

## 请提供：
1. **失败原因分析**：解释为什么测试失败
2. **问题定位**：指出具体是哪部分代码导致的问题
3. **修复建议**：给出具体的修复方案
4. **代码示例**：如果需要，提供修复后的代码片段

请用中文回答，保持简洁清晰。"""
        
        try:
            logger.info(f"正在分析测试失败: {test_name}")
            
            response = self.client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": "你是一个专业的 C++ 和 Qt 测试专家，擅长分析单元测试失败原因并提供修复建议。"},
                    {"role": "user", "content": prompt}
                ],
                stream=False,
                temperature=0.3  # 降低温度以获得更确定的答案
            )
            
            analysis = response.choices[0].message.content
            logger.info(f"AI 分析完成: {test_name}")
            return analysis
            
        except Exception as e:
            logger.error(f"AI 分析失败: {e}")
            return f"AI 分析失败: {str(e)}"


# 全局单例
_client = None

def get_deepseek_client() -> DeepSeekClient:
    """获取 DeepSeek 客户端单例"""
    global _client
    if _client is None:
        _client = DeepSeekClient()
    return _client
