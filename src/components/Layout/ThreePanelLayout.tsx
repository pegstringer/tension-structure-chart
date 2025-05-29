'use client'

import { useState, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { TensionStructureChart } from '@/types'

// ChartEditorを動的インポート
const ChartEditor = dynamic(() => import('@/components/Chart/ChartEditor'), {
  ssr: false
})

type PanelType = 'notion' | 'miro' | 'ai-chat'

interface PanelState {
  visible: boolean
  maximized: boolean
}

interface PanelStates {
  notion: PanelState
  miro: PanelState
  'ai-chat': PanelState
}

export default function ThreePanelLayout() {
  // テーマ管理
  const [isDarkMode, setIsDarkMode] = useState(true)
  
  // 各パネルの状態管理
  const [panelStates, setPanelStates] = useState<PanelStates>({
    notion: { visible: true, maximized: false },
    miro: { visible: true, maximized: false },
    'ai-chat': { visible: true, maximized: false }
  })

  // リサイズ用の幅管理 (fr単位)
  const [panelWidths, setPanelWidths] = useState({ notion: 2, miro: 2, ai: 1 })
  const [isResizing, setIsResizing] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // チャートデータ管理
  const [charts, setCharts] = useState<TensionStructureChart[]>([])
  const [editingChart, setEditingChart] = useState<TensionStructureChart | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  // チャート保存処理
  const handleSaveChart = (chart: TensionStructureChart) => {
    setCharts(prev => {
      const existingIndex = prev.findIndex(c => c.id === chart.id)
      if (existingIndex >= 0) {
        // 更新
        const updated = [...prev]
        updated[existingIndex] = chart
        return updated
      } else {
        // 新規追加
        return [...prev, chart]
      }
    })
    setShowEditor(false)
    setEditingChart(null)
  }

  // 新規チャート作成
  const handleNewChart = () => {
    setEditingChart(null)
    setShowEditor(true)
  }

  // チャート編集
  const handleEditChart = (chart: TensionStructureChart) => {
    setEditingChart(chart)
    setShowEditor(true)
  }

  // エディター終了
  const handleCancelEditor = () => {
    setShowEditor(false)
    setEditingChart(null)
  }

  // パネルの表示/非表示切り替え
  const toggleVisibility = (panel: PanelType) => {
    setPanelStates(prev => ({
      ...prev,
      [panel]: { ...prev[panel], visible: !prev[panel].visible }
    }))
  }

  // パネルの最大化/最小化切り替え
  const toggleMaximize = (panel: PanelType) => {
    setPanelStates(prev => {
      // 完全に新しいオブジェクトを作成
      const newStates: PanelStates = {
        notion: { ...prev.notion, maximized: false },
        miro: { ...prev.miro, maximized: false },
        'ai-chat': { ...prev['ai-chat'], maximized: false }
      }
      
      // 対象パネルのみ最大化状態を切り替え
      newStates[panel] = {
        ...prev[panel],
        maximized: !prev[panel].maximized
      }
      
      return newStates
    })
  }

  // 表示中のパネルを取得
  const visiblePanels = Object.entries(panelStates)
    .filter(([, state]) => state.visible)
    .map(([panelType]) => panelType as PanelType)

  // リサイズハンドラー（動的に判断）
  const handleResize = useCallback((boundary: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(boundary)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return

      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      const x = moveEvent.clientX - rect.left
      const containerWidth = rect.width
      const percentage = (x / containerWidth) * 100

      // 境界に応じて処理を分岐
      if (boundary === 'notion-miro' && panelStates.notion.visible && panelStates.miro.visible) {
        // Notion-MIRO間のリサイズ
        const minSize = 20
        const maxSize = 70
        
        if (percentage >= minSize && percentage <= maxSize) {
          const notionPercent = percentage
          const remainingPercent = 100 - notionPercent
          
          if (panelStates['ai-chat'].visible) {
            // 3パネル表示時
            const aiPercent = 20 // AI部分は20%固定
            const miroPercent = remainingPercent - aiPercent
            
            if (miroPercent >= minSize) {
              setPanelWidths(prev => ({
                ...prev,
                notion: (notionPercent / 100) * 5,
                miro: (miroPercent / 100) * 5,
                ai: (aiPercent / 100) * 5
              }))
            }
          } else {
            // 2パネル表示時（Notion + MIRO）
            const miroPercent = remainingPercent
            if (miroPercent >= minSize) {
              setPanelWidths(prev => ({
                ...prev,
                notion: (notionPercent / 100) * 5,
                miro: (miroPercent / 100) * 5
              }))
            }
          }
        }
      } else if (boundary === 'miro-ai' && panelStates.miro.visible && panelStates['ai-chat'].visible) {
        // MIRO-AI間のリサイズ
        const notionWidth = panelStates.notion.visible ? (panelWidths.notion / (panelWidths.notion + panelWidths.miro + panelWidths.ai)) * 100 : 0
        const availablePercent = 100 - notionWidth
        const boundaryPercent = percentage - notionWidth
        
        const minSize = 15
        const miroPercent = (boundaryPercent / availablePercent) * 100
        const aiPercent = ((availablePercent - boundaryPercent) / availablePercent) * 100
        
        if (miroPercent >= minSize && aiPercent >= minSize) {
          setPanelWidths(prev => ({
            ...prev,
            miro: (miroPercent / 100) * 3,
            ai: (aiPercent / 100) * 3
          }))
        }
      } else if (boundary === 'notion-ai' && panelStates.notion.visible && panelStates['ai-chat'].visible && !panelStates.miro.visible) {
        // Notion-AI間のリサイズ（MIROが非表示の場合）
        const minSize = 20
        const maxSize = 70
        
        if (percentage >= minSize && percentage <= maxSize) {
          const notionPercent = percentage
          const aiPercent = 100 - notionPercent
          
          if (aiPercent >= minSize) {
            setPanelWidths(prev => ({
              ...prev,
              notion: (notionPercent / 100) * 5,
              ai: (aiPercent / 100) * 5
            }))
          }
        }
      }
    }

    const handleMouseUp = () => {
      setIsResizing('')
      document.body.style.cursor = 'auto'
      document.body.style.userSelect = 'auto'
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [panelStates, panelWidths])

  // 最大化されたパネルがあるかチェック
  const hasMaximizedPanel = Object.values(panelStates).some(state => state.maximized)
  const maximizedPanel = Object.entries(panelStates).find(([, state]) => state.maximized)?.[0] as PanelType

  // CSS Grid template columns を動的生成（改良版）
  const getGridTemplate = () => {
    const elements = []
    
    if (panelStates.notion.visible) {
      elements.push(`${panelWidths.notion}fr`)
    }
    
    if (panelStates.miro.visible) {
      if (elements.length > 0) elements.push('4px') // 境界線
      elements.push(`${panelWidths.miro}fr`)
    }
    
    if (panelStates['ai-chat'].visible) {
      if (elements.length > 0) elements.push('4px') // 境界線
      elements.push(`${panelWidths.ai}fr`)
    }
    
    return elements.join(' ')
  }

  // 境界線が必要かどうかを判定する関数
  const needsBoundary = (leftPanel: PanelType, rightPanel: PanelType) => {
    return panelStates[leftPanel].visible && panelStates[rightPanel].visible
  }

  // 境界線の種類を判定する関数
  const getBoundaryType = () => {
    if (panelStates.notion.visible && panelStates.miro.visible && panelStates['ai-chat'].visible) {
      return 'all-three' // 3パネル全表示
    } else if (panelStates.notion.visible && panelStates.miro.visible) {
      return 'notion-miro' // Notion + MIRO
    } else if (panelStates.miro.visible && panelStates['ai-chat'].visible) {
      return 'miro-ai' // MIRO + AI
    } else if (panelStates.notion.visible && panelStates['ai-chat'].visible) {
      return 'notion-ai' // Notion + AI
    }
    return 'none'
  }

  const boundaryType = getBoundaryType()

  // テーマ切り替え関数
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  // テーマに応じたスタイル関数
  const getThemeClasses = (): ThemeClasses => {
    if (isDarkMode) {
      return {
        mainBg: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
        headerBg: 'bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600',
        headerText: 'text-white',
        panelBg: 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600',
        buttonActive: 'shadow-lg hover:shadow-xl hover:scale-105',
        textPrimary: 'text-white',
        textSecondary: 'text-slate-300',
        textInfo: 'text-slate-300',
        boundary: 'bg-slate-600',
        emptyBg: 'bg-slate-800/50 border-slate-700'
      }
    } else {
      return {
        mainBg: 'bg-gradient-to-br from-gray-50 to-white',
        headerBg: 'bg-white border-gray-200 shadow-md',
        headerText: 'text-gray-800',
        panelBg: 'bg-white border-gray-200',
        buttonActive: 'shadow-md hover:shadow-lg hover:scale-105',
        textPrimary: 'text-gray-800',
        textSecondary: 'text-gray-600',
        textInfo: 'text-gray-500',
        boundary: 'bg-gray-300',
        emptyBg: 'bg-gray-100 border-gray-300'
      }
    }
  }

  const theme = getThemeClasses()

  return (
    <div className={`h-screen flex flex-col ${theme.mainBg}`}>
      {/* ヘッダー - パネル制御 */}
      <header className={`${theme.headerBg} border-b p-4 shadow-lg backdrop-blur-sm`}>
        <div className="flex items-center justify-between">
          <h1 className={`text-xl font-bold ${theme.headerText} drop-shadow-sm`}>緊張構造チャート管理アプリ</h1>
          
          <div className="flex gap-2">
            {/* テーマ切り替えボタン */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-all duration-200 ${theme.buttonActive} ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-amber-500/30' 
                  : 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-slate-500/30'
              }`}
            >
              {isDarkMode ? '☀️' : '🌙'}
              {isDarkMode ? 'ライト' : 'ダーク'}
            </button>
            
            {/* パネル表示切り替えボタン */}
            <button
              onClick={() => toggleVisibility('notion')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-all duration-200 ${theme.buttonActive} ${
                panelStates.notion.visible 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/30' 
                  : `${isDarkMode ? 'bg-slate-600 text-slate-300 hover:bg-slate-500' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`
              }`}
            >
              {panelStates.notion.visible ? '👁️' : '🚫'}
              Notion風
            </button>
            
            <button
              onClick={() => toggleVisibility('miro')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-all duration-200 ${theme.buttonActive} ${
                panelStates.miro.visible 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-500/30' 
                  : `${isDarkMode ? 'bg-slate-600 text-slate-300 hover:bg-slate-500' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`
              }`}
            >
              {panelStates.miro.visible ? '👁️' : '🚫'}
              MIRO風
            </button>
            
            <button
              onClick={() => toggleVisibility('ai-chat')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-all duration-200 ${theme.buttonActive} ${
                panelStates['ai-chat'].visible 
                  ? 'bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-violet-500/30' 
                  : `${isDarkMode ? 'bg-slate-600 text-slate-300 hover:bg-slate-500' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`
              }`}
            >
              {panelStates['ai-chat'].visible ? '👁️' : '🚫'}
              AIチャット
            </button>
            
            {/* リサイズ情報表示 */}
            <div className={`text-xs ${theme.textInfo} flex items-center ml-4 font-mono`}>
              🔧 {visiblePanels.length}パネル | {boundaryType} | 
              リサイズ: {panelWidths.notion.toFixed(1)} - {panelWidths.miro.toFixed(1)} - {panelWidths.ai.toFixed(1)}
              {isResizing && <span className="text-cyan-400 font-bold ml-2 animate-pulse">📏 {isResizing}</span>}
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツエリア */}
      <main className="flex-1 overflow-hidden">
        {hasMaximizedPanel ? (
          // 最大化モード - 1つのパネルのみ表示
          <div className="h-full">
            {maximizedPanel === 'notion' && panelStates.notion.visible && (
              <NotionPanel 
                onToggleMaximize={() => toggleMaximize('notion')}
                isMaximized={true}
                charts={charts}
                showEditor={showEditor}
                editingChart={editingChart}
                onNewChart={handleNewChart}
                onEditChart={handleEditChart}
                ChartEditor={ChartEditor}
                onSaveChart={handleSaveChart}
                onCancelEditor={handleCancelEditor}
                isDarkMode={isDarkMode}
                theme={theme}
              />
            )}
            {maximizedPanel === 'miro' && panelStates.miro.visible && (
              <MiroPanel 
                onToggleMaximize={() => toggleMaximize('miro')}
                isMaximized={true}
                charts={charts}
                isDarkMode={isDarkMode}
                theme={theme}
              />
            )}
            {maximizedPanel === 'ai-chat' && panelStates['ai-chat'].visible && (
              <AIChatPanel 
                onToggleMaximize={() => toggleMaximize('ai-chat')}
                isMaximized={true}
                isDarkMode={isDarkMode}
                theme={theme}
              />
            )}
          </div>
        ) : visiblePanels.length === 0 ? (
          // パネルが1つも表示されていない場合
          <div className={`h-full flex items-center justify-center ${theme.textSecondary}`}>
            <div className={`text-center ${theme.emptyBg} backdrop-blur-sm p-8 rounded-2xl border shadow-2xl`}>
              <div className="text-6xl mb-4">👁️</div>
              <p className={`text-lg mb-4 ${theme.textPrimary}`}>表示するパネルがありません</p>
              <p className={`text-sm ${theme.textSecondary}`}>上部のボタンでパネルを表示してください</p>
            </div>
          </div>
        ) : (
          // 通常モード - CSS Grid リサイズ可能レイアウト
          <div 
            ref={containerRef}
            className="h-full"
            style={{
              display: 'grid',
              gridTemplateColumns: getGridTemplate(),
              gap: '0'
            }}
          >
            {/* Notion風パネル */}
            {panelStates.notion.visible && (
              <NotionPanel 
                onToggleMaximize={() => toggleMaximize('notion')}
                isMaximized={false}
                charts={charts}
                showEditor={showEditor}
                editingChart={editingChart}
                onNewChart={handleNewChart}
                onEditChart={handleEditChart}
                ChartEditor={ChartEditor}
                onSaveChart={handleSaveChart}
                onCancelEditor={handleCancelEditor}
                isDarkMode={isDarkMode}
                theme={theme}
              />
            )}
            
            {/* Notion-MIRO間の境界線 */}
            {needsBoundary('notion', 'miro') && (
              <div 
                className={`${theme.boundary} ${isDarkMode 
                  ? 'hover:bg-gradient-to-r hover:from-blue-500 hover:to-emerald-500 cursor-col-resize transition-all duration-200 shadow-lg' 
                  : 'hover:bg-gradient-to-r hover:from-blue-400 hover:to-emerald-400 cursor-col-resize transition-all duration-200 shadow-md'
                } ${
                  isResizing === 'notion-miro' 
                    ? 'bg-gradient-to-r from-blue-500 to-emerald-500 shadow-xl' 
                    : ''
                }`}
                onMouseDown={handleResize('notion-miro')}
                style={{ width: '4px' }}
                title="Notion-MIRO境界をドラッグしてリサイズ"
              />
            )}
            
            {/* MIRO風パネル */}
            {panelStates.miro.visible && (
              <MiroPanel 
                onToggleMaximize={() => toggleMaximize('miro')}
                isMaximized={false}
                charts={charts}
                isDarkMode={isDarkMode}
                theme={theme}
              />
            )}
            
            {/* MIRO-AI間の境界線 */}
            {needsBoundary('miro', 'ai-chat') && (
              <div 
                className={`${theme.boundary} ${isDarkMode 
                  ? 'hover:bg-gradient-to-r hover:from-emerald-500 hover:to-violet-500 cursor-col-resize transition-all duration-200 shadow-lg' 
                  : 'hover:bg-gradient-to-r hover:from-emerald-400 hover:to-violet-400 cursor-col-resize transition-all duration-200 shadow-md'
                } ${
                  isResizing === 'miro-ai' 
                    ? 'bg-gradient-to-r from-emerald-500 to-violet-500 shadow-xl' 
                    : ''
                }`}
                onMouseDown={handleResize('miro-ai')}
                style={{ width: '4px' }}
                title="MIRO-AI境界をドラッグしてリサイズ"
              />
            )}
            
            {/* Notion-AI間の境界線（MIROが非表示の場合） */}
            {needsBoundary('notion', 'ai-chat') && !panelStates.miro.visible && (
              <div 
                className={`${theme.boundary} ${isDarkMode 
                  ? 'hover:bg-gradient-to-r hover:from-blue-500 hover:to-violet-500 cursor-col-resize transition-all duration-200 shadow-lg' 
                  : 'hover:bg-gradient-to-r hover:from-blue-400 hover:to-violet-400 cursor-col-resize transition-all duration-200 shadow-md'
                } ${
                  isResizing === 'notion-ai' 
                    ? 'bg-gradient-to-r from-blue-500 to-violet-500 shadow-xl' 
                    : ''
                }`}
                onMouseDown={handleResize('notion-ai')}
                style={{ width: '4px' }}
                title="Notion-AI境界をドラッグしてリサイズ"
              />
            )}
            
            {/* AIチャットパネル */}
            {panelStates['ai-chat'].visible && (
              <AIChatPanel 
                onToggleMaximize={() => toggleMaximize('ai-chat')}
                isMaximized={false}
                isDarkMode={isDarkMode}
                theme={theme}
              />
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// 以下のコンポーネントは同じなので省略...
// (NotionPanel, MiroPanel, AIChatPanel)

// Notion風パネルコンポーネント
interface ThemeClasses {
  mainBg: string
  headerBg: string
  headerText: string
  panelBg: string
  buttonActive: string
  textPrimary: string
  textSecondary: string
  textInfo: string
  boundary: string
  emptyBg: string
}

interface NotionPanelProps {
  onToggleMaximize: () => void
  isMaximized: boolean
  charts: TensionStructureChart[]
  showEditor: boolean
  editingChart: TensionStructureChart | null
  onNewChart: () => void
  onEditChart: (chart: TensionStructureChart) => void
  ChartEditor: React.ComponentType<{
    chart?: TensionStructureChart | null
    onSave?: (chart: TensionStructureChart) => void
    onCancel?: () => void
    isMaximized?: boolean
    isDarkMode?: boolean
  }>
  onSaveChart: (chart: TensionStructureChart) => void
  onCancelEditor: () => void
  isDarkMode: boolean
  theme: ThemeClasses
}

function NotionPanel({ 
  onToggleMaximize, 
  isMaximized, 
  charts, 
  showEditor, 
  editingChart, 
  onNewChart, 
  onEditChart, 
  ChartEditor, 
  onSaveChart, 
  onCancelEditor,
  isDarkMode,
  theme
}: NotionPanelProps) {
  // アクションステップの展開状態管理
  const [expandedActionSteps, setExpandedActionSteps] = useState<Record<string, boolean>>({})

  // アクションステップの展開トグル
  const toggleActionSteps = (chartId: string) => {
    setExpandedActionSteps(prev => ({
      ...prev,
      [chartId]: !prev[chartId]
    }))
  }

  return (
    <div className={`h-full ${theme.panelBg} border flex flex-col overflow-hidden shadow-2xl backdrop-blur-sm`}>
      <div className={`flex items-center justify-between p-3 border-b ${isDarkMode ? 'border-slate-600 bg-gradient-to-r from-blue-600 to-blue-700' : 'border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600'} flex-shrink-0 shadow-lg`}>
        <h2 className="font-semibold text-white drop-shadow-sm">📝 Notion風リスト</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleMaximize()
            }}
            className={`p-1 ${isDarkMode ? 'hover:bg-blue-500/30' : 'hover:bg-blue-300/50'} rounded-lg transition-all duration-200 text-lg cursor-pointer hover:scale-110 hover:shadow-lg`}
            title={isMaximized ? "最小化" : "最大化"}
          >
            {isMaximized ? '🔽' : '🔼'}
          </button>
          {!showEditor && (
            <button
              onClick={onNewChart}
              className={`px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm hover:from-blue-400 hover:to-blue-500 transition-all duration-200 whitespace-nowrap ${theme.buttonActive}`}
            >
              + 新規作成
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {showEditor ? (
          <ChartEditor
            chart={editingChart}
            onSave={onSaveChart}
            onCancel={onCancelEditor}
            isMaximized={isMaximized}
            isDarkMode={isDarkMode}
          />
        ) : (
          <div className="p-4">
            {charts.length === 0 ? (
            <div className="text-center py-8 text-slate-300">
                <div className="text-4xl mb-4">📝</div>
                <p className={`mb-4 ${theme.textPrimary}`}>まだチャートがありません</p>
                <button
                  onClick={onNewChart}
                  className={`px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-400 hover:to-blue-500 transition-all duration-200 ${theme.buttonActive}`}
                >
                  最初のチャートを作成
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {charts.map((chart) => (
                  <div key={chart.id} className={`p-3 ${isDarkMode ? 'bg-slate-700/50 hover:bg-slate-600/60 border-slate-600' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'} backdrop-blur-sm rounded-xl transition-all duration-200 border shadow-lg hover:shadow-xl hover:scale-[1.02]`}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`font-medium ${theme.textPrimary} flex-1 min-w-0`}>🎯 {chart.title}</h3>
                      <button
                        onClick={() => onEditChart(chart)}
                        className={`px-2 py-1 text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-400 hover:to-blue-500 transition-all duration-200 whitespace-nowrap ml-2 ${theme.buttonActive}`}
                      >
                        編集
                      </button>
                    </div>
                    <div className="ml-4 space-y-2 text-sm">
                      <div className={`${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                        💡 創り出したいもの: {chart.goal.content.slice(0, 50)}{chart.goal.content.length > 50 ? '...' : ''}
                      </div>
                      <div className={`${isDarkMode ? 'text-emerald-300' : 'text-emerald-600'}`}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleActionSteps(chart.id)}
                            className={`${isDarkMode ? 'text-emerald-300 hover:text-emerald-100' : 'text-emerald-600 hover:text-emerald-800'} transition-colors hover:scale-110`}
                          >
                            {expandedActionSteps[chart.id] ? '▼' : '▶'}
                          </button>
                          <span>⚡ アクションステップ: {chart.actionSteps.length}個</span>
                        </div>
                        {expandedActionSteps[chart.id] && (
                          <div className="ml-6 mt-2 space-y-2">
                            {chart.actionSteps.map((step, index) => (
                              <div key={step.id} className={`p-2 ${isDarkMode ? 'bg-emerald-800/30 border-emerald-600/50' : 'bg-emerald-100 border-emerald-300'} backdrop-blur-sm rounded-lg border shadow-md`}>
                                <div className={`font-medium ${isDarkMode ? 'text-emerald-200' : 'text-emerald-800'} text-xs mb-1`}>
                                  Step {index + 1}
                                </div>
                                <div className={`${isDarkMode ? 'text-emerald-100' : 'text-emerald-700'} text-xs mb-1`}>
                                  {step.content}
                                </div>
                                <div className={`flex items-center gap-3 text-xs ${isDarkMode ? 'text-emerald-300' : 'text-emerald-600'}`}>
                                  <span>📅 {step.deadline.date.toLocaleDateString('ja-JP')}</span>
                                  <span>👤 {step.responsiblePerson.name}</span>
                                  <span className={`px-1 py-0.5 rounded-lg text-xs ${
                                    step.status === 'completed' ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/50' :
                                    step.status === 'in_progress' ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50' :
                                    'bg-slate-500/30 text-slate-300 border border-slate-500/50'
                                  }`}>
                                    {step.status === 'completed' ? '完了' :
                                     step.status === 'in_progress' ? '進行中' : '未開始'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className={`${isDarkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                        📊 現実: {chart.reality.content.slice(0, 50)}{chart.reality.content.length > 50 ? '...' : ''}
                      </div>
                      <div className={`flex items-center gap-4 text-xs ${theme.textSecondary} mt-2 flex-wrap`}>
                        <span>📅 期日: {chart.goal.deadline.date.toLocaleDateString('ja-JP')}</span>
                        <span>👤 責任者: {chart.goal.responsiblePerson.name}</span>
                        <span className={`px-2 py-1 rounded-lg shadow-md ${
                          chart.status === 'completed' ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/50' :
                          chart.status === 'in_progress' ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50' :
                          'bg-slate-500/30 text-slate-300 border border-slate-500/50'
                        }`}>
                          {chart.status === 'completed' ? '完了' :
                           chart.status === 'in_progress' ? '進行中' : '未開始'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// MIRO風パネルコンポーネント
function MiroPanel({ onToggleMaximize, isMaximized, charts, isDarkMode, theme }: { 
  onToggleMaximize: () => void, 
  isMaximized: boolean, 
  charts: TensionStructureChart[],
  isDarkMode: boolean,
  theme: ThemeClasses
}) {
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5))
  }

  const handleResetView = () => {
    setZoom(1)
    setPanX(0)
    setPanY(0)
  }

  return (
    <div className={`h-full ${theme.panelBg} border flex flex-col overflow-hidden shadow-2xl backdrop-blur-sm`}>
      <div className={`flex items-center justify-between p-3 border-b ${isDarkMode ? 'border-slate-600 bg-gradient-to-r from-emerald-600 to-emerald-700' : 'border-gray-200 bg-gradient-to-r from-emerald-500 to-emerald-600'} flex-shrink-0 shadow-lg`}>
        <h2 className="font-semibold text-white drop-shadow-sm">🎨 MIRO風キャンバス</h2>
        <div className="flex items-center gap-2">
          {/* ズームコントロール */}
          <div className={`flex items-center gap-1 ${isDarkMode ? 'bg-slate-700/80 border-slate-500' : 'bg-white/80 border-gray-300'} backdrop-blur-sm rounded-lg border shadow-lg`}>
            <button
              onClick={handleZoomOut}
              className={`p-1 ${isDarkMode ? 'hover:bg-slate-600 text-white' : 'hover:bg-gray-200 text-gray-700'} transition-all duration-200 text-sm font-bold hover:scale-110`}
              title="ズームアウト"
            >
              −
            </button>
            <span className={`px-2 text-xs ${isDarkMode ? 'text-slate-200' : 'text-gray-600'} min-w-12 text-center font-mono`}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className={`p-1 ${isDarkMode ? 'hover:bg-slate-600 text-white' : 'hover:bg-gray-200 text-gray-700'} transition-all duration-200 text-sm font-bold hover:scale-110`}
              title="ズームイン"
            >
              ＋
            </button>
          </div>
          <button
            onClick={handleResetView}
            className={`px-2 py-1 text-xs ${isDarkMode ? 'bg-slate-600 hover:bg-slate-500' : 'bg-gray-500 hover:bg-gray-600'} text-white rounded-lg transition-all duration-200 whitespace-nowrap ${theme.buttonActive}`}
            title="リセット"
          >
            Reset
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleMaximize()
            }}
            className={`p-1 ${isDarkMode ? 'hover:bg-emerald-500/30' : 'hover:bg-emerald-300/50'} rounded-lg transition-all duration-200 text-lg cursor-pointer hover:scale-110 hover:shadow-lg`}
            title={isMaximized ? "最小化" : "最大化"}
          >
            {isMaximized ? '🔽' : '🔼'}
          </button>
        </div>
      </div>
      <div className={`flex-1 p-4 overflow-auto ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
        <div className={`relative w-full ${isDarkMode ? 'bg-slate-700/30 border-slate-500' : 'bg-white border-gray-300'} backdrop-blur-sm rounded-2xl border-2 border-dashed shadow-inner ${
          isMaximized 
            ? 'min-h-screen' 
            : charts.length > 0 
              ? 'pb-8' 
              : 'h-96'
        }`} style={{
          minHeight: isMaximized 
            ? '100vh' 
            : charts.length > 0 
              ? `${Math.max(400, Math.ceil(charts.length / 2) * 180 + 100)}px`
              : '384px'
        }}>
          {charts.length === 0 ? (
            <div className={`flex items-center justify-center ${theme.textSecondary} ${
              isMaximized ? 'h-screen' : 'h-96'
            }`}>
              <div className={`text-center ${theme.emptyBg} backdrop-blur-sm p-8 rounded-2xl border shadow-2xl`}>
                <div className="text-6xl mb-4">🎨</div>
                <p className={`${theme.textPrimary}`}>create your first chart to see it here</p>
              </div>
            </div>
          ) : (
            <div 
              className="p-4 w-full" 
              style={{
                transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
                transformOrigin: '0 0',
                transition: 'transform 0.1s ease-out',
                minHeight: isMaximized 
                  ? '100vh' 
                  : charts.length > 0 
                    ? `${Math.ceil(charts.length / 2) * 160 + 80}px`
                    : '320px'
              }}
            >
              {charts.map((chart, index) => {
                // 最大化時は4列、通常時は2列でコンパクト表示
                const columns = isMaximized ? 4 : 2
                const offsetX = (index % columns) * (isMaximized ? 250 : 180) + 20
                const offsetY = Math.floor(index / columns) * (isMaximized ? 200 : 140) + 20
                
                return (
                  <div key={chart.id} className="absolute" style={{ left: offsetX, top: offsetY }}>
                    {/* A. 創り出したいもの */}
                    <div className={`p-2 bg-blue-500/20 backdrop-blur-sm rounded-xl border border-blue-400/50 mb-3 shadow-lg hover:shadow-xl transition-all duration-200 ${
                      isMaximized ? 'w-56' : 'w-40'
                    }`}>
                      <div className={`font-medium text-blue-200 mb-1 ${
                        isMaximized ? 'text-sm' : 'text-xs'
                      }`}>
                        🎯 {chart.title}
                      </div>
                      <div className="text-xs text-blue-300">
                        {chart.goal.content.slice(0, isMaximized ? 40 : 20)}{chart.goal.content.length > (isMaximized ? 40 : 20) ? '...' : ''}
                      </div>
                      <div className="text-xs text-blue-400 mt-1">
                        📅 {chart.goal.deadline.date.toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                    
                    {/* 矢印 - 縦方向 */}
                    <div className={`w-0.5 bg-slate-400 mx-auto mb-1 shadow-sm ${
                      isMaximized ? 'h-6' : 'h-4'
                    }`}></div>
                    <div className="w-2 h-2 bg-slate-400 transform rotate-45 mx-auto mb-1 shadow-sm"></div>
                    
                    {/* C. アクションステップ */}
                    <div className={`space-y-1 mb-3 ${
                      isMaximized ? 'w-56' : 'w-40'
                    }`}>
                      {chart.actionSteps.slice(0, isMaximized ? 3 : 2).map((step, stepIndex) => (
                        <div key={step.id} className="p-2 bg-emerald-500/20 backdrop-blur-sm rounded-xl border border-emerald-400/50 shadow-lg hover:shadow-xl transition-all duration-200">
                          <div className="text-xs font-medium text-emerald-200">
                            ⚡ Step {stepIndex + 1}
                          </div>
                          <div className="text-xs text-emerald-300">
                            {step.content.slice(0, isMaximized ? 30 : 15)}{step.content.length > (isMaximized ? 30 : 15) ? '...' : ''}
                          </div>
                          <div className="text-xs text-emerald-400">
                            👤 {step.responsiblePerson.name}
                          </div>
                        </div>
                      ))}
                      {chart.actionSteps.length > (isMaximized ? 3 : 2) && (
                        <div className="text-xs text-slate-400 text-center p-1">
                          +{chart.actionSteps.length - (isMaximized ? 3 : 2)} more...
                        </div>
                      )}
                    </div>
                    
                    {/* 矢印 - 縦方向 */}
                    <div className={`w-0.5 bg-slate-400 mx-auto mb-1 shadow-sm ${
                      isMaximized ? 'h-6' : 'h-4'
                    }`}></div>
                    <div className="w-2 h-2 bg-slate-400 transform rotate-45 mx-auto mb-1 shadow-sm"></div>
                    
                    {/* B. 現実 */}
                    <div className={`p-2 bg-orange-500/20 backdrop-blur-sm rounded-xl border border-orange-400/50 shadow-lg hover:shadow-xl transition-all duration-200 ${
                      isMaximized ? 'w-56' : 'w-40'
                    }`}>
                      <div className={`font-medium text-orange-200 ${
                        isMaximized ? 'text-sm' : 'text-xs'
                      }`}>📊 現実</div>
                      <div className="text-xs text-orange-300 mt-1">
                        {chart.reality.content.slice(0, isMaximized ? 50 : 20)}{chart.reality.content.length > (isMaximized ? 50 : 20) ? '...' : ''}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// AIチャットパネルコンポーネント - 縦スクロール対応に最適化
function AIChatPanel({ onToggleMaximize, isMaximized, isDarkMode, theme }: { 
  onToggleMaximize: () => void, 
  isMaximized: boolean,
  isDarkMode: boolean,
  theme: ThemeClasses
}) {
  return (
    <div className={`h-full ${theme.panelBg} border flex flex-col overflow-hidden shadow-2xl backdrop-blur-sm`}>
      <div className={`flex items-center justify-between p-3 border-b ${isDarkMode ? 'border-slate-600 bg-gradient-to-r from-violet-600 to-violet-700' : 'border-gray-200 bg-gradient-to-r from-violet-500 to-violet-600'} flex-shrink-0 shadow-lg`}>
        <h2 className="font-semibold text-white drop-shadow-sm">🤖 AIチャット</h2>
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleMaximize()
          }}
          className={`p-1 ${isDarkMode ? 'hover:bg-violet-500/30' : 'hover:bg-violet-300/50'} rounded-lg transition-all duration-200 text-lg cursor-pointer hover:scale-110 hover:shadow-lg`}
          title={isMaximized ? "最小化" : "最大化"}
        >
          {isMaximized ? '🔽' : '🔼'}
        </button>
      </div>
      
      <div className="flex-1 flex flex-col min-h-0">
        {/* チャット履歴 - 縦並び */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
          {/* ユーザーメッセージ */}
          <div className={`${isDarkMode ? 'bg-blue-500/20 border-blue-400/50' : 'bg-blue-100 border-blue-300'} backdrop-blur-sm rounded-xl p-3 ml-4 border shadow-lg`}>
            <div className="flex items-start gap-2 mb-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md">
                You
              </div>
              <span className={`text-xs ${theme.textSecondary}`}>17:15</span>
            </div>
            <p className={`text-sm ${isDarkMode ? 'text-blue-100' : 'text-blue-800'}`}>
              素晴らしい！惜しいのは上のボタンでキャンバスを消した時にAIチャットが見えなくなっていることだね。
            </p>
          </div>
          
          {/* AI回答 */}
          <div className={`${isDarkMode ? 'bg-emerald-500/20 border-emerald-400/50' : 'bg-emerald-100 border-emerald-300'} backdrop-blur-sm rounded-xl p-3 mr-4 border shadow-lg`}>
            <div className="flex items-start gap-2 mb-2">
              <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md">
                AI
              </div>
              <span className={`text-xs ${theme.textSecondary}`}>完全修正</span>
            </div>
            <p className={`text-sm ${isDarkMode ? 'text-emerald-100' : 'text-emerald-800'} font-medium`}>
              🎯 完全修正！全てのパネル表示パターンに対応しました。Notion+AI、MIRO+AI、全組み合わせで適切に境界線とリサイズが動作します。ヘッダーで現在のパターンも表示しています。
            </p>
          </div>
        </div>
        
        {/* 入力エリア */}
        <div className={`p-3 border-t ${isDarkMode ? 'border-slate-600 bg-slate-800/50' : 'border-gray-200 bg-gray-100'} backdrop-blur-sm flex-shrink-0`}>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="メッセージを入力..."
              className={`flex-1 px-3 py-2 border ${isDarkMode ? 'border-slate-500 bg-slate-700/50 text-white placeholder-slate-400' : 'border-gray-300 bg-white text-gray-800 placeholder-gray-500'} backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400 text-sm min-w-0`}
            />
            <button className={`px-4 py-2 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-lg hover:from-violet-400 hover:to-violet-500 transition-all duration-200 text-sm whitespace-nowrap ${theme.buttonActive}`}>
              送信
            </button>
          </div>
          <div className={`flex justify-between items-center mt-2 text-xs ${theme.textSecondary}`}>
            <span>💡 全パターン対応</span>
            <span>✅ Phase 1完了</span>
          </div>
        </div>
      </div>
    </div>
  )
}