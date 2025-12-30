/**
 * 实时视觉监控面板组件
 */
import { useState, useEffect, useRef } from 'react'
import { visual } from '../api/visual'
import type { ScreenFrameResult } from '../api/visual'

export function MonitorPanel() {
  const [isAppRunning, setIsAppRunning] = useState(false)
  const [screenFrame, setScreenFrame] = useState<string | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [loading, setLoading] = useState(false)
  const intervalRef = useRef<number | null>(null)

  const launchApp = async () => {
    setLoading(true)
    try {
      const res = await visual.launchApp()
      if (res.success) {
        setIsAppRunning(true)
        alert(`✅ 应用已启动 (PID: ${res.pid})`)
      } else {
        alert(`❌ 启动失败: ${res.error}`)
      }
    } catch (error) {
      alert(`❌ 错误: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const closeApp = async () => {
    setLoading(true)
    try {
      const res = await visual.closeApp()
      if (res.success) {
        setIsAppRunning(false)
        setIsMonitoring(false)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        alert('✅ 应用已关闭')
      } else {
        alert(`❌ 关闭失败: ${res.error}`)
      }
    } catch (error) {
      alert(`❌ 错误: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const toggleMonitoring = () => {
    if (isMonitoring) {
      // 停止监控
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsMonitoring(false)
    } else {
      // 开始监控
      setIsMonitoring(true)
      captureFrame() // 立即捕获一帧
      
      // 每 500ms 捕获一帧
      intervalRef.current = window.setInterval(() => {
        captureFrame()
      }, 500)
    }
  }

  const captureFrame = async () => {
    try {
      const res: ScreenFrameResult = await visual.getScreenFrame()
      if (res.success && res.image) {
        setScreenFrame(res.image)
      }
    } catch (error) {
      console.error('捕获帧失败:', error)
    }
  }

  // 清理定时器
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">实时视觉监控</h3>

      {/* 控制按钮 */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={launchApp}
          disabled={loading || isAppRunning}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
        >
          🚀 启动应用
        </button>
        <button
          onClick={closeApp}
          disabled={loading || !isAppRunning}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
        >
          ⏹️ 关闭应用
        </button>
        <button
          onClick={toggleMonitoring}
          disabled={!isAppRunning}
          className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isMonitoring
              ? 'bg-yellow-500 hover:bg-yellow-600'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isMonitoring ? '⏸️ 停止监控' : '▶️ 开始监控'}
        </button>
        <button
          onClick={captureFrame}
          disabled={!isAppRunning}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
        >
          📸 单帧截图
        </button>
      </div>

      {/* 视频监控区域 */}
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
        {screenFrame ? (
          <img 
            src={screenFrame} 
            alt="屏幕监控" 
            className="w-full h-auto"
          />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">点击"启动应用"开始监控</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}