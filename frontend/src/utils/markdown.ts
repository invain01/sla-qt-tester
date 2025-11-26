/**
 * Markdown 渲染工具（带 Shiki 代码高亮）
 */
import { createMarkdownExit } from 'markdown-exit'
import { codeToHtml } from 'shiki'

// 创建基础 markdown 实例（不使用 highlight 选项）
const md = createMarkdownExit({
  html: true,        // 允许 HTML 标签
  linkify: true,     // 自动转换 URL 为链接
  typographer: true, // 启用智能引号和其他排版替换
  breaks: true,      // 转换换行符为 <br>
})

/**
 * 转义 HTML 特殊字符
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * 渲染 Markdown 为 HTML（异步，带 Shiki 高亮）
 */
export async function renderMarkdown(content: string): Promise<string> {
  try {
    // 第一步：先用 markdown-exit 渲染基础 Markdown
    let html = md.render(content)
    
    // 第二步：查找所有代码块并用 Shiki 替换
    const codeBlockRegex = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g
    const matches = Array.from(html.matchAll(codeBlockRegex))
    
    // 异步处理所有代码块
    for (const match of matches) {
      const [fullMatch, lang, code] = match
      try {
        // 解码 HTML 实体
        const decodedCode = decodeHtmlEntities(code)
        
        // 使用 Shiki 高亮
        const highlighted = await codeToHtml(decodedCode, {
          lang: lang || 'text',
          theme: 'github-dark',
        })
        
        // 替换原始代码块
        html = html.replace(fullMatch, highlighted)
      } catch (error) {
        console.warn(`Shiki 高亮失败 (${lang}):`, error)
        // 保持原样
      }
    }
    
    return html
  } catch (error) {
    console.error('Markdown 渲染失败:', error)
    return escapeHtml(content)
  }
}

/**
 * 解码 HTML 实体
 */
function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = text
  return textarea.value
}

/**
 * 渲染 Markdown 为纯文本（移除 HTML 标签）
 */
export async function renderMarkdownText(content: string): Promise<string> {
  const html = await renderMarkdown(content)
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}
