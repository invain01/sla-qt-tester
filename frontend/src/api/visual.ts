/**
 * 视觉测试 API
 * 封装视觉测试相关的 Python 调用
 */

// 扩展 Window 类型
declare global {
  interface Window {
    pywebview?: {
      api: {
        launch_target_app: () => Promise<AppLaunchResult>
        close_target_app: () => Promise<ApiResult>
        get_screen_frame: () => Promise<ScreenFrameResult>
        get_window_info: () => Promise<WindowInfoResult>
        focus_target_window: (windowTitle?: string) => Promise<ApiResult>
        run_stress_test: (iterations: number) => Promise<StressTestResult>
        execute_ai_command: (command: string) => Promise<AiCommandResult>
        verify_visual_result: (pattern: string) => Promise<VisualVerifyResult>
        set_ai_api_key: (apiKey: string, baseUrl?: string) => Promise<ApiResult>
        generate_ai_pipeline: (prompt: string, testName?: string) => Promise<GeneratePipelineResult>
        // MAA 风格视觉识别 API
        find_template: (templatePath: string, threshold?: number, roi?: number[]) => Promise<TemplateMatchResult>
        find_color: (lower: number[], upper: number[], roi?: number[], colorSpace?: string, minCount?: number) => Promise<ColorMatchResult>
        click_template: (templatePath: string, threshold?: number, roi?: number[], offset?: number[]) => Promise<ClickTemplateResult>
        wait_for_template: (templatePath: string, threshold?: number, timeout?: number, interval?: number, roi?: number[]) => Promise<WaitTemplateResult>
        run_pipeline: (config: PipelineConfig, entry: string, resourceDir?: string) => Promise<PipelineResult>
        run_pipeline_from_file: (jsonPath: string, entry: string, resourceDir?: string) => Promise<PipelineResult>
        get_vision_capabilities: () => Promise<VisionCapabilities>
        // Pipeline 测试 API
        scan_pipeline_tests: (directory?: string) => Promise<PipelineTestFile[]>
        run_pipeline_test: (pipelinePath: string, entry: string, launchApp?: boolean, resourceDir?: string) => Promise<PipelineTestResult>
      }
    }
  }
}

// 类型定义
export interface ApiResult {
  success: boolean
  error?: string
  message?: string
}

export interface AppLaunchResult extends ApiResult {
  pid?: number
  path?: string
}

export interface ScreenFrameResult extends ApiResult {
  image?: string
  width?: number
  height?: number
}

export interface WindowInfoResult extends ApiResult {
  all_windows?: string[]
  target_windows?: string[]
}

export interface StressTestResult extends ApiResult {
  total_iterations?: number
  successful?: number
  failed?: number
  logs?: string[]
}

export interface AiCommandResult extends ApiResult {
  command?: string
  ai_interpretation?: string
  executed?: boolean
  message?: string
}

export interface VisualVerifyResult extends ApiResult {
  pattern?: string
  edge_ratio?: number
  verified?: boolean
  message?: string
}

export interface GeneratePipelineResult extends ApiResult {
  file_path?: string
  filename?: string
  prompt?: string
  pipeline_config?: Record<string, PipelineNode>
  entry_nodes?: string[]
  node_count?: number
  raw_response?: string
}

// ==================== MAA 风格视觉识别类型 ====================

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface MatchResult {
  box: Rect
  score: number
  text?: string
  label?: string
}

export interface TemplateMatchResult extends ApiResult {
  algorithm?: string
  cost_ms?: number
  box?: Rect
  score?: number
  all_count?: number
  filtered_count?: number
}

export interface ColorMatchResult extends ApiResult {
  algorithm?: string
  cost_ms?: number
  box?: Rect
  pixel_count?: number
  all_count?: number
  filtered_count?: number
}

export interface ClickTemplateResult extends ApiResult {
  action?: string
  position?: { x: number; y: number }
  find_result?: TemplateMatchResult
}

export interface WaitTemplateResult extends ApiResult {
  elapsed_ms?: number
  find_result?: TemplateMatchResult
}

export interface PipelineNode {
  recognition?: string
  template?: string[]
  threshold?: number[]
  roi?: number[]
  lower?: number[]
  upper?: number[]
  method?: number
  count?: number
  connected?: boolean
  action?: string
  target?: boolean | number[]
  target_offset?: number[]
  begin?: boolean | number[]
  end?: number[]
  duration?: number
  input_text?: string
  next?: string[]
  timeout?: number
  rate_limit?: number
  pre_delay?: number
  post_delay?: number
  inverse?: boolean
  enabled?: boolean
}

export type PipelineConfig = Record<string, PipelineNode>

export interface PipelineResult extends ApiResult {
  entry?: string
  executed_nodes?: string[]
  last_node?: string
  last_reco_result?: {
    success: boolean
    algorithm: string
    cost_ms: number
    box?: Rect
    score?: number
  }
  cost_ms?: number
  logs?: string[]
}

export interface VisionCapabilities extends ApiResult {
  visual_libs_available?: boolean
  vision_module_available?: boolean
  capabilities?: string[]
  description?: string
}

// ==================== Pipeline 测试类型 ====================

export interface PipelineTestFile {
  name: string
  path: string
  entries: string[]
  description: string
  node_count: number
}

export interface PipelineTestResult extends ApiResult {
  pipeline_path?: string
  entry?: string
  app_launched?: boolean
  resource_dir?: string
  pipeline_result?: PipelineResult
}

/**
 * 通用 Python 调用函数
 */
async function callPy<T>(fn: string, ...args: unknown[]): Promise<T> {
  if (!window.pywebview) {
    throw new Error('PyWebView API 未就绪')
  }

  const api = window.pywebview.api as unknown as Record<string, (...args: unknown[]) => Promise<T>>
  if (!api[fn]) {
    throw new Error(`Python 方法不存在: ${fn}`)
  }

  return await api[fn](...args)
}

// ==================== 视觉测试 API ====================

export const visual = {
  // 基础控制
  launchApp: () => 
    callPy<AppLaunchResult>('launch_target_app'),
  
  closeApp: () => 
    callPy<ApiResult>('close_target_app'),
  
  getScreenFrame: () => 
    callPy<ScreenFrameResult>('get_screen_frame'),
  
  getWindowInfo: () => 
    callPy<WindowInfoResult>('get_window_info'),
  
  focusWindow: (windowTitle?: string) => 
    callPy<ApiResult>('focus_target_window', windowTitle),
  
  // 压力测试 & AI
  runStressTest: (iterations: number) => 
    callPy<StressTestResult>('run_stress_test', iterations),
  
  executeAiCommand: (command: string) => 
    callPy<AiCommandResult>('execute_ai_command', command),
  
  verifyVisual: (pattern: string) => 
    callPy<VisualVerifyResult>('verify_visual_result', pattern),
  
  setApiKey: (apiKey: string, baseUrl?: string) => 
    callPy<ApiResult>('set_ai_api_key', apiKey, baseUrl),

  /**
   * 根据自然语言提示词生成 Pipeline JSON 配置文件
   * @param prompt 自然语言测试描述
   * @param testName 测试名称（可选，用于生成文件名）
   */
  generateAiPipeline: (prompt: string, testName?: string) =>
    callPy<GeneratePipelineResult>('generate_ai_pipeline', prompt, testName),

  // ==================== MAA 风格视觉识别 ====================
  
  /**
   * 模板匹配 - 在屏幕上查找模板图片
   */
  findTemplate: (templatePath: string, threshold = 0.7, roi?: number[]) =>
    callPy<TemplateMatchResult>('find_template', templatePath, threshold, roi),
  
  /**
   * 颜色匹配 - 在屏幕上查找指定颜色
   */
  findColor: (lower: number[], upper: number[], roi?: number[], colorSpace = 'HSV', minCount = 100) =>
    callPy<ColorMatchResult>('find_color', lower, upper, roi, colorSpace, minCount),
  
  /**
   * 找图并点击 - 查找模板并点击其中心
   */
  clickTemplate: (templatePath: string, threshold = 0.7, roi?: number[], offset?: number[]) =>
    callPy<ClickTemplateResult>('click_template', templatePath, threshold, roi, offset),
  
  /**
   * 等待模板出现
   */
  waitForTemplate: (templatePath: string, threshold = 0.7, timeout = 10000, interval = 500, roi?: number[]) =>
    callPy<WaitTemplateResult>('wait_for_template', templatePath, threshold, timeout, interval, roi),
  
  /**
   * 运行视觉测试流水线
   */
  runPipeline: (config: PipelineConfig, entry: string, resourceDir?: string) =>
    callPy<PipelineResult>('run_pipeline', config, entry, resourceDir),
  
  /**
   * 从 JSON 文件运行 Pipeline
   */
  runPipelineFromFile: (jsonPath: string, entry: string, resourceDir?: string) =>
    callPy<PipelineResult>('run_pipeline_from_file', jsonPath, entry, resourceDir),
  
  /**
   * 获取视觉识别能力信息
   */
  getVisionCapabilities: () =>
    callPy<VisionCapabilities>('get_vision_capabilities'),

  // ==================== Pipeline 测试 ====================
  
  /**
   * 扫描 Pipeline 测试配置文件
   */
  scanPipelineTests: (directory?: string) =>
    callPy<PipelineTestFile[]>('scan_pipeline_tests', directory),
  
  /**
   * 运行 Pipeline 测试
   */
  runPipelineTest: (pipelinePath: string, entry: string, launchApp = true, resourceDir?: string) =>
    callPy<PipelineTestResult>('run_pipeline_test', pipelinePath, entry, launchApp, resourceDir),
}

export default visual

