import { useState } from 'react'
import type { FileNode } from '../api/qt-project'
import { Icon } from '@iconify/react'

interface FileTreeProps {
  nodes: FileNode[]
  onFileClick?: (node: FileNode) => void
}

export function FileTree({ nodes, onFileClick }: FileTreeProps) {
  return (
    <div className="text-sm">
      {nodes.map((node) => (
        <TreeNode key={node.path} node={node} onFileClick={onFileClick} />
      ))}
    </div>
  )
}

interface TreeNodeProps {
  node: FileNode
  level?: number
  onFileClick?: (node: FileNode) => void
}

function TreeNode({ node, level = 0, onFileClick }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(level < 2) // 默认展开前两层

  const handleClick = () => {
    if (node.type === 'directory') {
      setExpanded(!expanded)
    } else if (onFileClick) {
      onFileClick(node)
    }
  }

  // 根据文件类型返回图标

  const getFileIcon = (node: FileNode, isExpanded: boolean = false) => {
    if (node.type === 'directory') {
      return (
        <Icon 
          icon={isExpanded ? 'vscode-icons:default-folder-opened' : 'vscode-icons:default-folder'} 
          className="w-4 h-4 flex-shrink-0"
        />
      )
    }
    
    const ext = node.name.split('.').pop()?.toLowerCase()
    
    let iconName = 'vscode-icons:default-file'
    
    switch (ext) {
      case 'cpp':
      case 'cc':
      case 'cxx':
        iconName = 'vscode-icons:file-type-cpp'
        break
      case 'h':
      case 'hpp':
      case 'hxx':
        iconName = 'vscode-icons:file-type-cppheader'
        break
      case 'c':
        iconName = 'vscode-icons:file-type-c'
        break
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'bmp':
      case 'webp':
      case 'ico':
        iconName = 'vscode-icons:file-type-image'
        break
      case 'txt':
        iconName = 'vscode-icons:file-type-text'
        break
      case 'md':
        iconName = 'vscode-icons:file-type-markdown'
        break
      case 'json':
        iconName = 'vscode-icons:file-type-json'
        break
      case 'xml':
        iconName = 'vscode-icons:file-type-xml'
        break
      case 'cmake':
        iconName = 'vscode-icons:file-type-cmake'
        break
      case 'pro':
        iconName = 'vscode-icons:file-type-light-config'
        break
    }
    
    return <Icon icon={iconName} className="w-4 h-4 flex-shrink-0" />
  }

  return (
    <div>
      <div
        style={{ paddingLeft: `${level * 12 + 4}px` }}
        className="flex items-center gap-1.5 py-0.5 px-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-xs"
        onClick={handleClick}
      >
        {getFileIcon(node, expanded)}
        <span className="text-gray-700 dark:text-gray-300 truncate">
          {node.name}
        </span>
        {node.type === 'directory' && (
          <span className="ml-auto text-gray-400 text-xs">
            {expanded ? '▼' : '▶'}
          </span>
        )}
      </div>

      {node.type === 'directory' && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              level={level + 1}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}
