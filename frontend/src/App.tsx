import { useState, useEffect } from 'react'
import { calculator, users, system } from './api/py'
import type { User, SystemInfo } from './api/py'

function App() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'users' | 'system'>('calculator')

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            SLA Qt Tester
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            SLA Quality Testing Application for Qt Projects
          </p>
        </header>

        {/* 标签页导航 */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg bg-white dark:bg-gray-800 shadow-md p-1">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-6 py-3 rounded-lg transition-all ${
                activeTab === 'calculator'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              🧮 计算器
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 rounded-lg transition-all ${
                activeTab === 'users'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              👥 用户管理
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`px-6 py-3 rounded-lg transition-all ${
                activeTab === 'system'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              ℹ️ 系统信息
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'calculator' && <CalculatorTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'system' && <SystemTab />}
        </div>
      </div>
    </div>
  )
}

// ==================== 计算器标签页 ====================
function CalculatorTab() {
  const [a, setA] = useState<string>('10')
  const [b, setB] = useState<string>('5')
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const calculate = async (operation: 'add' | 'subtract' | 'multiply' | 'divide' | 'power') => {
    setLoading(true)
    try {
      const numA = parseFloat(a)
      const numB = parseFloat(b)
      
      if (isNaN(numA) || isNaN(numB)) {
        setResult('❌ 请输入有效数字')
        return
      }

      const res = await calculator[operation](numA, numB)
      
      if (typeof res === 'object' && 'error' in res) {
        setResult(`❌ ${res.error}`)
      } else {
        setResult(`✅ 结果: ${res}`)
      }
    } catch (error) {
      setResult(`❌ 错误: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">计算器</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            数字 A
          </label>
          <input
            type="number"
            value={a}
            onChange={(e) => setA(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            数字 B
          </label>
          <input
            type="number"
            value={b}
            onChange={(e) => setB(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-6">
        <button
          onClick={() => calculate('add')}
          disabled={loading}
          className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium disabled:opacity-50"
        >
          ➕ 加
        </button>
        <button
          onClick={() => calculate('subtract')}
          disabled={loading}
          className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium disabled:opacity-50"
        >
          ➖ 减
        </button>
        <button
          onClick={() => calculate('multiply')}
          disabled={loading}
          className="px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium disabled:opacity-50"
        >
          ✖️ 乘
        </button>
        <button
          onClick={() => calculate('divide')}
          disabled={loading}
          className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50"
        >
          ➗ 除
        </button>
        <button
          onClick={() => calculate('power')}
          disabled={loading}
          className="px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium disabled:opacity-50"
        >
          🔼 幂
        </button>
      </div>

      {result && (
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <p className="text-lg font-mono text-gray-800 dark:text-white">{result}</p>
        </div>
      )}
    </div>
  )
}

// ==================== 用户管理标签页 ====================
function UsersTab() {
  const [userList, setUserList] = useState<User[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const loadUsers = async () => {
    try {
      const list = await users.list()
      setUserList(list)
    } catch (error) {
      setMessage(`❌ 加载失败: ${error}`)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreate = async () => {
    if (!name || !email) {
      setMessage('❌ 请填写姓名和邮箱')
      return
    }

    setLoading(true)
    try {
      const result = await users.create(name, email)
      if ('error' in result) {
        setMessage(`❌ ${result.error}`)
      } else {
        setMessage(`✅ 创建成功: ${result.name}`)
        setName('')
        setEmail('')
        await loadUsers()
      }
    } catch (error) {
      setMessage(`❌ 错误: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId: number) => {
    setLoading(true)
    try {
      const result = await users.delete(userId)
      if ('error' in result) {
        setMessage(`❌ ${result.error}`)
      } else {
        setMessage('✅ 删除成功')
        await loadUsers()
      }
    } catch (error) {
      setMessage(`❌ 错误: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">用户管理</h2>

      {/* 创建用户表单 */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">创建新用户</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="姓名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
          />
          <input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
        >
          ➕ 创建用户
        </button>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-800 dark:text-white">{message}</p>
        </div>
      )}

      {/* 用户列表 */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">用户列表</h3>
        {userList.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">暂无用户</p>
        ) : (
          userList.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-800 dark:text-white">{user.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  ID: {user.id} | 创建于: {new Date(user.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(user.id)}
                disabled={loading}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                🗑️ 删除
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ==================== 系统信息标签页 ====================
function SystemTab() {
  const [info, setInfo] = useState<SystemInfo | null>(null)
  const [version, setVersion] = useState<string>('')
  const [ping, setPing] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSystemInfo = async () => {
      try {
        const [sysInfo, ver, pong] = await Promise.all([
          system.info(),
          system.version(),
          system.ping(),
        ])
        setInfo(sysInfo)
        setVersion(ver)
        setPing(pong)
      } catch (error) {
        console.error('加载系统信息失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSystemInfo()
  }, [])

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <p className="text-gray-600 dark:text-gray-300">加载中...</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">系统信息</h2>

      <div className="space-y-4">
        <InfoRow label="应用版本" value={version} />
        <InfoRow label="连接状态" value={ping === 'pong' ? '✅ 正常' : '❌ 异常'} />
        
        {info && (
          <>
            <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
            <InfoRow label="操作系统" value={info.platform} />
            <InfoRow label="系统版本" value={info.platform_version} />
            <InfoRow label="Python 版本" value={info.python_version} />
            <InfoRow label="架构" value={info.machine} />
          </>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>提示:</strong> 这是一个 PyWebView 桌面应用，前端使用 Vite + React，
          后端使用 Python，通过 JS Bridge 进行通信。
        </p>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <span className="text-gray-900 dark:text-white font-mono">{value}</span>
    </div>
  )
}

export default App
