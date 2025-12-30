/**
 * 压力测试面板组件
 */
import { useState } from 'react'
import { visual } from '../api/visual'
import type { StressTestResult } from '../api/visual'

export function StressTestPanel() {
  const [iterations, setIterations] = useState(10)
  const [result, setResult] = useState<StressTestResult | null>(null)
  const [running, setRunning] = useState(false)

  const runStressTest = async () => {
    setRunning(true)
    setResult(null)
    try {
      const res = await visual.runStressTest(iterations)
      setResult(res)
    } catch (error) {
      console.error('压力测试错误:', error)
      setResult({ success: false, error: String(error) })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">折线算法压力测试</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            迭代次数
          </label>
          <div className="flex gap-3">
            <input
              type="number"
              value={iterations}
              onChange={(e) => setIterations(Math.max(1, Math.min(100, parseInt(e.target.value) || 10)))}
              min="1"
              max="100"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <button
              onClick={runStressTest}
              disabled={running}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              {running ? '⏳ 运行中...' : '⚡ 开始测试'}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            将自动生成随机坐标并模拟拖拽连线操作（范围：1-100）
          </p>
        </div>

        {result && (
          <div className="space-y-3">
            {/* 结果统计 */}
            <div className={`p-4 rounded-lg border ${
              result.success
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <h4 className={`font-semibold mb-2 ${
                result.success
                  ? 'text-green-900 dark:text-green-100'
                  : 'text-red-900 dark:text-red-100'
              }`}>
                {result.success ? '✅ 测试完成' : '❌ 测试失败'}
              </h4>
              {result.success && (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">总数：</span>
                    <span className="font-bold text-gray-900 dark:text-white">{result.total_iterations}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">成功：</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{result.successful}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">失败：</span>
                    <span className="font-bold text-red-600 dark:text-red-400">{result.failed}</span>
                  </div>
                </div>
              )}
              {result.error && (
                <p className="text-sm text-red-800 dark:text-red-200">{result.error}</p>
              )}
            </div>

            {/* 测试日志 */}
            {result.logs && result.logs.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">测试日志</h4>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {result.logs.map((log, index) => (
                    <div
                      key={index}
                      className="text-xs font-mono text-gray-700 dark:text-gray-300 py-1"
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}