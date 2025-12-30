/**
 * 测试历史记录面板组件
 */
import { useState, useEffect } from 'react'
import { getAllTestHistory, deleteTestRecords, exportTestRecordsHTML, type TestRun } from '../api/test-history'

interface HistoryPanelProps {
  projectPath?: string
}

export function HistoryPanel({ projectPath }: HistoryPanelProps) {
  const [records, setRecords] = useState<TestRun[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 加载历史记录
  const loadHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllTestHistory(100)
      setRecords(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  // 切换选择
  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(records.map(r => r.id)))
    }
  }

  // 删除选中的记录
  const handleDelete = async () => {
    if (selectedIds.size === 0) {
      alert('请选择要删除的记录')
      return
    }

    if (!confirm(`确定要删除选中的 ${selectedIds.size} 条记录吗？此操作不可撤销。`)) {
      return
    }

    try {
      const result = await deleteTestRecords(Array.from(selectedIds))
      if (result.success) {
        alert(`成功删除 ${result.deleted} 条记录`)
        setSelectedIds(new Set())
        loadHistory()
      } else {
        alert(`删除失败: ${result.error}`)
      }
    } catch (err) {
      alert(`删除失败: ${err}`)
    }
  }

  // 导出为HTML
  const handleExport = async () => {
    if (selectedIds.size === 0) {
      alert('请选择要导出的记录')
      return
    }

    try {
      const result = await exportTestRecordsHTML(Array.from(selectedIds))
      if (result.success) {
        alert(`成功导出 ${selectedIds.size} 条记录\n\n文件已保存到:\n${result.file_path}\n\n文件名: ${result.filename}`)
      } else {
        alert(`导出失败: ${result.error}`)
      }
    } catch (err) {
      alert(`导出失败: ${err}`)
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600 dark:text-green-400'
      case 'failed': return 'text-red-600 dark:text-red-400'
      case 'error': return 'text-yellow-600 dark:text-yellow-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    return type === 'ui' ? '🖥️' : '⚙️'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-sm text-gray-500 dark:text-gray-400">加载历史记录...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 text-sm mb-2">加载失败</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={loadHistory}
          className="px-4 py-2 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          历史记录
        </h3>
        <button
          onClick={loadHistory}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm"
        >
          刷新
        </button>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">暂无测试记录</p>
        </div>
      ) : (
        <>
          {/* 操作按钮 */}
          <div className="flex items-center gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.size === records.length}
                onChange={toggleSelectAll}
                className="rounded border-gray-300"
              />
              <span className="text-gray-600 dark:text-gray-400">
                全选 ({selectedIds.size}/{records.length})
              </span>
            </label>
            
            <div className="flex gap-2 ml-auto">
              <button
                onClick={handleExport}
                disabled={selectedIds.size === 0}
                className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                导出 HTML
              </button>
              <button
                onClick={handleDelete}
                disabled={selectedIds.size === 0}
                className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                删除
              </button>
            </div>
          </div>

          {/* 记录列表 */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {records.map((record) => (
              <div
                key={record.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedIds.has(record.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
                onClick={() => toggleSelect(record.id)}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(record.id)}
                    onChange={() => toggleSelect(record.id)}
                    className="mt-1 rounded border-gray-300"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getTypeIcon(record.test_type)}</span>
                      <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {record.test_name}
                      </span>
                      <span className={`text-xs font-medium ${getStatusColor(record.status)}`}>
                        {record.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <div className="truncate">
                        📁 {record.project_path}
                      </div>
                      <div className="flex items-center gap-4">
                        <span>🕒 {record.duration}</span>
                        <span>✅ {record.passed}/{record.total}</span>
                        <span>📅 {new Date(record.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}