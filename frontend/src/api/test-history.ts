/**
 * 测试历史记录 API
 */

// ==================== 类型定义 ====================

export interface TestRun {
  id: number
  project_path: string
  test_name: string
  test_type: 'unit' | 'ui'
  status: 'passed' | 'failed' | 'error'
  total: number
  passed: number
  failed: number
  skipped: number
  duration: string
  ai_analysis?: string
  created_at: string
}

export interface TestCaseDetail {
  id: number
  run_id: number
  case_name: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  message?: string
}

export interface Screenshot {
  id: number
  run_id: number
  step_number: number
  step_name: string
  image_data: string  // base64
  created_at: string
}

export interface TestRunDetail extends TestRun {
  output: string
  details: TestCaseDetail[]
  screenshots: Screenshot[]
}

export interface TestStatistics {
  total_runs: number
  passed_runs: number
  failed_runs: number
  unique_tests: number
}

// ==================== API 调用 ====================

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

/**
 * 获取测试历史记录
 */
export async function getTestHistory(projectPath: string, limit = 50): Promise<TestRun[]> {
  return callPy<TestRun[]>('get_test_history', projectPath, limit)
}

/**
 * 获取测试详情（含用例和截图）
 */
export async function getTestDetail(runId: number): Promise<TestRunDetail> {
  return callPy<TestRunDetail>('get_test_detail', runId)
}

/**
 * 更新 AI 分析报告
 */
export async function updateTestAiAnalysis(runId: number, analysis: string): Promise<{ success: boolean }> {
  return callPy<{ success: boolean }>('update_test_ai_analysis', runId, analysis)
}

/**
 * 获取测试统计
 */
export async function getTestStatistics(projectPath: string): Promise<TestStatistics> {
  return callPy<TestStatistics>('get_test_statistics', projectPath)
}

/**
 * 清理旧测试记录
 */
export async function cleanupOldTests(days: number): Promise<{ deleted: number; success: boolean }> {
  return callPy<{ deleted: number; success: boolean }>('cleanup_old_tests', days)
}

/**
 * 获取所有测试历史记录
 */
export async function getAllTestHistory(limit = 200): Promise<TestRun[]> {
  return callPy<TestRun[]>('get_all_test_history', limit)
}

/**
 * 删除测试记录
 */
export async function deleteTestRecords(runIds: number[]): Promise<{ deleted: number; success: boolean; error?: string }> {
  return callPy<{ deleted: number; success: boolean; error?: string }>('delete_test_records', runIds)
}

/**
 * 导出测试记录为HTML
 */
export async function exportTestRecordsHTML(runIds: number[]): Promise<{ file_path: string; filename: string; success: boolean; error?: string }> {
  return callPy<{ file_path: string; filename: string; success: boolean; error?: string }>('export_test_records_html', runIds)
}
