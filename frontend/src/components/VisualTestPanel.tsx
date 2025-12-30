/**
 * 视觉测试面板组件
 * 包含实时监控、Pipeline测试、压力测试和AI自动化四个子功能
 */
import { useState, useEffect, useRef } from 'react'
import { visual } from '../api/visual'
import { MonitorPanel } from './MonitorPanel'
import { StressTestPanel } from './StressTestPanel'
import type { 
  ScreenFrameResult, 
  StressTestResult, 
  AiCommandResult, 
  VisualVerifyResult,
  PipelineTestFile,
  PipelineTestResult
} from '../api/visual'

type SubTab = 'pipeline' | 'monitor' | 'stress' | 'ai'

export function VisualTestPanel() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('pipeline')

  return (
    <div className="space-y-4">
      {/* 子标签页导航 */}
      <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
        <button
          onClick={() => setActiveSubTab('pipeline')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
            activeSubTab === 'pipeline'
              ? 'bg-blue-500 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          🔄 Pipeline 测试
        </button>
        <button
          onClick={() => setActiveSubTab('monitor')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
            activeSubTab === 'monitor'
              ? 'bg-green-500 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          📹 实时监控
        </button>
        <button
          onClick={() => setActiveSubTab('stress')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
            activeSubTab === 'stress'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          ⚡ 压力测试
        </button>
        <button
          onClick={() => setActiveSubTab('ai')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
            activeSubTab === 'ai'
              ? 'bg-purple-500 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          🤖 AI 自动化
        </button>
      </div>

      {/* 内容区域 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
        {activeSubTab === 'pipeline' && <PipelineTestPanel />}
        {activeSubTab === 'monitor' && <MonitorPanel />}
        {activeSubTab === 'stress' && <StressTestPanel />}
        {activeSubTab === 'ai' && <AiAutomationPanel />}
      </div>
    </div>
  )
}

// ==================== Pipeline 测试面板 ====================
function PipelineTestPanel() {
  const [pipelines, setPipelines] = useState<PipelineTestFile[]>([])
  const [results, setResults] = useState<Map<string, PipelineTestResult>>(new Map())
  const [running, setRunning] = useState<Set<string>>(new Set())
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(false)
  const [launchApp, setLaunchApp] = useState(true)

  // 扫描 Pipeline 配置文件
  const handleScan = async () => {
    setLoading(true)
    try {
      const pipelineList = await visual.scanPipelineTests()
      setPipelines(pipelineList)
      
      // 设置默认入口
      const entries = new Map<string, string>()
      pipelineList.forEach(p => {
        if (p.entries.length > 0) {
          entries.set(p.path, p.entries[0])
        }
      })
      setSelectedEntry(entries)
    } catch (error) {
      console.error('扫描 Pipeline 失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 运行单个 Pipeline 测试
  const handleRunTest = async (pipeline: PipelineTestFile) => {
    const entry = selectedEntry.get(pipeline.path)
    if (!entry) {
      alert('请选择入口节点')
      return
    }

    const key = `${pipeline.path}:${entry}`
    setRunning(prev => new Set(prev).add(key))
    
    try {
      const result = await visual.runPipelineTest(pipeline.path, entry, launchApp)
      setResults(prev => new Map(prev).set(key, result))
      setSelectedPipeline(key)
    } catch (error) {
      console.error('运行 Pipeline 失败:', error)
      setResults(prev => new Map(prev).set(key, { 
        success: false, 
        error: String(error) 
      }))
    } finally {
      setRunning(prev => {
        const newSet = new Set(prev)
        newSet.delete(key)
        return newSet
      })
    }
  }

  // 运行所有 Pipeline 测试
  const handleRunAll = async () => {
    for (const pipeline of pipelines) {
      await handleRunTest(pipeline)
    }
  }

  // 初始加载
  useEffect(() => {
    handleScan()
  }, [])

  const selectedResult = selectedPipeline ? results.get(selectedPipeline) : null

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Pipeline 视觉测试</h3>

      {/* 操作按钮 */}
      <div className="flex gap-2 flex-wrap items-center">
        <button
          onClick={handleScan}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm font-medium transition-colors"
        >
          {loading ? '扫描中...' : '🔄 扫描 Pipeline'}
        </button>
        <button
          onClick={handleRunAll}
          disabled={pipelines.length === 0 || running.size > 0}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm font-medium transition-colors"
        >
          ▶ 运行全部
        </button>
        
        {/* 启动应用选项 */}
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 ml-4">
          <input
            type="checkbox"
            checked={launchApp}
            onChange={(e) => setLaunchApp(e.target.checked)}
            className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
          />
          运行前启动被测应用
        </label>
      </div>

      {/* Pipeline 列表 */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
          📁 Pipeline 配置列表
        </h4>

        {pipelines.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">未找到 Pipeline 配置文件</p>
            <p className="text-xs mt-2">请在 core/vision/examples 目录添加 *pipeline*.json 文件</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pipelines.map((pipeline) => {
              const entry = selectedEntry.get(pipeline.path) || ''
              const key = `${pipeline.path}:${entry}`
              const result = results.get(key)
              const isRunning = running.has(key)
              const statusIcon = result
                ? result.success
                  ? '✅'
                  : '❌'
                : '⚪'

              return (
                <div
                  key={pipeline.path}
                  className={`p-3 rounded-lg border transition-colors ${
                    selectedPipeline === key
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl">{statusIcon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 dark:text-white truncate">
                          {pipeline.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {pipeline.node_count} 个节点 • {pipeline.description || '无描述'}
                        </div>
                        {result && result.pipeline_result && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            执行节点: {result.pipeline_result.executed_nodes?.join(' → ') || '无'}
                            {result.pipeline_result.cost_ms && ` • ${result.pipeline_result.cost_ms.toFixed(0)}ms`}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* 入口选择 */}
                      <select
                        value={entry}
                        onChange={(e) => {
                          setSelectedEntry(prev => new Map(prev).set(pipeline.path, e.target.value))
                        }}
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {pipeline.entries.map(e => (
                          <option key={e} value={e}>{e}</option>
                        ))}
                      </select>
                      
                      {/* 运行按钮 */}
                      <button
                        onClick={() => handleRunTest(pipeline)}
                        disabled={isRunning}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-sm font-medium transition-colors whitespace-nowrap"
                      >
                        {isRunning ? '⏳ 运行中...' : '▶ 运行'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 测试结果详情 */}
      {selectedResult && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
            📊 测试结果详情
          </h4>

          <div className="space-y-3">
            {/* 概览 */}
            <div className={`p-3 rounded-lg ${
              selectedResult.success
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800 dark:text-white">
                  {selectedResult.entry || '未知入口'}
                </span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  selectedResult.success
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {selectedResult.success ? '✅ 成功' : '❌ 失败'}
                </span>
              </div>
              
              {selectedResult.error && (
                <div className="text-sm text-red-600 dark:text-red-400 mt-2">
                  错误: {selectedResult.error}
                </div>
              )}
            </div>

            {/* Pipeline 执行日志 */}
            {selectedResult.pipeline_result?.logs && selectedResult.pipeline_result.logs.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  执行日志
                </h5>
                <div className="bg-gray-900 rounded-lg p-3 max-h-60 overflow-y-auto">
                  {selectedResult.pipeline_result.logs.map((log, index) => (
                    <div
                      key={index}
                      className="text-xs font-mono text-gray-300 py-0.5"
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 识别结果 */}
            {selectedResult.pipeline_result?.last_reco_result && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  查看最后识别结果
                </summary>
                <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-x-auto">
                  {JSON.stringify(selectedResult.pipeline_result.last_reco_result, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== AI 自动化面板 ====================
function AiAutomationPanel() {
  const [apiKey, setApiKey] = useState('')
  const [command, setCommand] = useState('')
  const [pattern, setPattern] = useState('line')
  const [aiResult, setAiResult] = useState<AiCommandResult | null>(null)
  const [verifyResult, setVerifyResult] = useState<VisualVerifyResult | null>(null)
  const [loading, setLoading] = useState(false)

  const setApiKeyHandler = async () => {
    if (!apiKey.trim()) {
      alert('请输入 API Key')
      return
    }
    setLoading(true)
    try {
      const res = await visual.setApiKey(apiKey.trim())
      if (res.success) {
        alert('✅ API Key 设置成功')
      } else {
        alert(`❌ 设置失败: ${res.error}`)
      }
    } catch (error) {
      alert(`❌ 错误: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const executeCommand = async () => {
    if (!command.trim()) {
      alert('请输入测试指令')
      return
    }
    setLoading(true)
    setAiResult(null)
    try {
      const res = await visual.executeAiCommand(command.trim())
      setAiResult(res)
    } catch (error) {
      console.error('执行指令错误:', error)
      setAiResult({ success: false, error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  const verifyVisual = async () => {
    setLoading(true)
    setVerifyResult(null)
    try {
      const res = await visual.verifyVisual(pattern)
      setVerifyResult(res)
    } catch (error) {
      console.error('视觉验证错误:', error)
      setVerifyResult({ success: false, error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">AI 自动化测试</h3>

      {/* API Key 设置 */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm">
          讯飞星火 API Key
          <span className="ml-2 text-xs font-normal text-green-600 dark:text-green-400">
            ✓ 已自动从配置文件加载
          </span>
        </h4>
        <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
          如需更换 API Key，请在下方输入新的密钥
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="输入新的 API Key（可选）"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={setApiKeyHandler}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            更换
          </button>
        </div>
      </div>

      {/* AI 指令执行 */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            自然语言测试指令
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder='例如："画一个红色的矩形"'
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={executeCommand}
              disabled={loading}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              执行
            </button>
          </div>
        </div>

        {aiResult && (
          <div className={`p-4 rounded-lg border ${
            aiResult.success
              ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <h4 className={`font-semibold mb-2 text-sm ${
              aiResult.success
                ? 'text-purple-900 dark:text-purple-100'
                : 'text-red-900 dark:text-red-100'
            }`}>
              {aiResult.success ? '🤖 AI 响应' : '❌ 执行失败'}
            </h4>
            {aiResult.ai_interpretation && (
              <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-white dark:bg-gray-800 p-2 rounded">
                {aiResult.ai_interpretation}
              </pre>
            )}
            {aiResult.message && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{aiResult.message}</p>
            )}
            {aiResult.error && (
              <p className="text-sm text-red-800 dark:text-red-200">{aiResult.error}</p>
            )}
          </div>
        )}
      </div>

      {/* 视觉验证 */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            视觉结果验证
          </label>
          <div className="flex gap-2">
            <select
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="line">线条</option>
              <option value="rectangle">矩形</option>
              <option value="circle">圆形</option>
            </select>
            <button
              onClick={verifyVisual}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              验证
            </button>
          </div>
        </div>

        {verifyResult && (
          <div className={`p-4 rounded-lg border ${
            verifyResult.success && verifyResult.verified
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          }`}>
            <h4 className={`font-semibold mb-2 text-sm ${
              verifyResult.success && verifyResult.verified
                ? 'text-green-900 dark:text-green-100'
                : 'text-yellow-900 dark:text-yellow-100'
            }`}>
              {verifyResult.success && verifyResult.verified ? '✅ 验证通过' : '⚠️ 验证结果'}
            </h4>
            <div className="text-sm space-y-1">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">边缘比例：</span>{verifyResult.edge_ratio}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">消息：</span>{verifyResult.message}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

