'use client'

import { useState } from 'react'
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
  // 各パネルの状態管理
  const [panelStates, setPanelStates] = useState<PanelStates>({
    notion: { visible: true, maximized: false },
    miro: { visible: true, maximized: false },
    'ai-chat': { visible: true, maximized: false }
  })

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

  // 最大化されたパネルがあるかチェック
  const hasMaximizedPanel = Object.values(panelStates).some(state => state.maximized)
  const maximizedPanel = Object.entries(panelStates).find(([, state]) => state.maximized)?.[0] as PanelType

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* ヘッダー - パネル制御 */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">緊張構造チャート管理アプリ</h1>
          
          <div className="flex gap-2">
            {/* パネル表示切り替えボタン */}
            <button
              onClick={() => toggleVisibility('notion')}
              className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
                panelStates.notion.visible 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {panelStates.notion.visible ? '👁️' : '🚫'}
              Notion風
            </button>
            
            <button
              onClick={() => toggleVisibility('miro')}
              className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
                panelStates.miro.visible 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {panelStates.miro.visible ? '👁️' : '🚫'}
              MIRO風
            </button>
            
            <button
              onClick={() => toggleVisibility('ai-chat')}
              className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
                panelStates['ai-chat'].visible 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {panelStates['ai-chat'].visible ? '👁️' : '🚫'}
              AIチャット
            </button>
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
              />
            )}
            {maximizedPanel === 'miro' && panelStates.miro.visible && (
              <MiroPanel 
                onToggleMaximize={() => toggleMaximize('miro')}
                isMaximized={true}
                charts={charts}
              />
            )}
            {maximizedPanel === 'ai-chat' && panelStates['ai-chat'].visible && (
              <AIChatPanel 
                onToggleMaximize={() => toggleMaximize('ai-chat')}
                isMaximized={true}
              />
            )}
          </div>
        ) : (
          // 通常モード - シンプルなグリッドレイアウト
          <div className="h-full flex flex-col">
            {/* 上部エリア: Notion風 + MIRO風 */}
            <div className="flex-1 flex min-h-0">
              {/* Notion風パネル */}
              <div className={`${panelStates.notion.visible ? 'flex-1' : 'hidden'} min-w-0`}>
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
                />
              </div>
              
              {/* MIRO風パネル */}
              <div className={`${panelStates.miro.visible ? 'flex-1' : 'hidden'} min-w-0`}>
                <MiroPanel 
                  onToggleMaximize={() => toggleMaximize('miro')}
                  isMaximized={false}
                  charts={charts}
                />
              </div>
            </div>
            
            {/* 下部エリア: AIチャット */}
            {panelStates['ai-chat'].visible && (
              <div className="h-80 border-t border-gray-200">
                <AIChatPanel 
                  onToggleMaximize={() => toggleMaximize('ai-chat')}
                  isMaximized={false}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// Notion風パネルコンポーネント
interface NotionPanelProps {
  onToggleMaximize: () => void
  isMaximized: boolean
  charts: TensionStructureChart[]
  showEditor: boolean
  editingChart: TensionStructureChart | null
  onNewChart: () => void
  onEditChart: (chart: TensionStructureChart) => void
  ChartEditor: any
  onSaveChart: (chart: TensionStructureChart) => void
  onCancelEditor: () => void
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
  onCancelEditor 
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
    <div className="h-full bg-white border border-gray-200 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-blue-50">
        <h2 className="font-semibold text-blue-800">📝 Notion風リスト</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleMaximize()
            }}
            className="p-1 hover:bg-blue-200 rounded transition-colors text-lg cursor-pointer"
            title={isMaximized ? "最小化" : "最大化"}
          >
            {isMaximized ? '🔽' : '🔼'}
          </button>
          {!showEditor && (
            <button
              onClick={onNewChart}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
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
          />
        ) : (
          <div className="p-4">
            {charts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📝</div>
                <p className="mb-4">まだチャートがありません</p>
                <button
                  onClick={onNewChart}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  最初のチャートを作成
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {charts.map((chart) => (
                  <div key={chart.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-800">🎯 {chart.title}</h3>
                      <button
                        onClick={() => onEditChart(chart)}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        編集
                      </button>
                    </div>
                    <div className="ml-4 space-y-2 text-sm">
                      <div className="text-blue-600">
                        💡 創り出したいもの: {chart.goal.content.slice(0, 50)}{chart.goal.content.length > 50 ? '...' : ''}
                      </div>
                      <div className="text-green-600">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleActionSteps(chart.id)}
                            className="text-green-600 hover:text-green-800 transition-colors"
                          >
                            {expandedActionSteps[chart.id] ? '▼' : '▶'}
                          </button>
                          <span>⚡ アクションステップ: {chart.actionSteps.length}個</span>
                        </div>
                        {expandedActionSteps[chart.id] && (
                          <div className="ml-6 mt-2 space-y-2">
                            {chart.actionSteps.map((step, index) => (
                              <div key={step.id} className="p-2 bg-green-50 rounded border border-green-200">
                                <div className="font-medium text-green-800 text-xs mb-1">
                                  Step {index + 1}
                                </div>
                                <div className="text-green-700 text-xs mb-1">
                                  {step.content}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-green-600">
                                  <span>📅 {step.deadline.date.toLocaleDateString('ja-JP')}</span>
                                  <span>👤 {step.responsiblePerson.name}</span>
                                  <span className={`px-1 py-0.5 rounded text-xs ${
                                    step.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    step.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-700'
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
                      <div className="text-orange-600">
                        📊 現実: {chart.reality.content.slice(0, 50)}{chart.reality.content.length > 50 ? '...' : ''}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                        <span>📅 期日: {chart.goal.deadline.date.toLocaleDateString('ja-JP')}</span>
                        <span>👤 責任者: {chart.goal.responsiblePerson.name}</span>
                        <span className={`px-2 py-1 rounded ${
                          chart.status === 'completed' ? 'bg-green-100 text-green-700' :
                          chart.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
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
function MiroPanel({ onToggleMaximize, isMaximized, charts }: { onToggleMaximize: () => void, isMaximized: boolean, charts: TensionStructureChart[] }) {
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
    <div className="h-full bg-white border border-gray-200 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-green-50">
        <h2 className="font-semibold text-green-800">🎨 MIRO風キャンバス</h2>
        <div className="flex items-center gap-2">
          {/* ズームコントロール */}
          <div className="flex items-center gap-1 bg-white rounded border border-gray-300">
            <button
              onClick={handleZoomOut}
              className="p-1 hover:bg-gray-100 transition-colors text-sm font-bold"
              title="ズームアウト"
            >
              −
            </button>
            <span className="px-2 text-xs text-gray-600 min-w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 hover:bg-gray-100 transition-colors text-sm font-bold"
              title="ズームイン"
            >
              ＋
            </button>
          </div>
          <button
            onClick={handleResetView}
            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
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
            className="p-1 hover:bg-green-200 rounded transition-colors text-lg cursor-pointer"
            title={isMaximized ? "最小化" : "最大化"}
          >
            {isMaximized ? '🔽' : '🔼'}
          </button>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-auto bg-gray-50">
        <div className={`relative w-full bg-white rounded-lg border-2 border-dashed border-gray-300 ${
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
            <div className={`flex items-center justify-center text-gray-400 ${
              isMaximized ? 'h-screen' : 'h-96'
            }`}>
              <div className="text-center">
                <div className="text-6xl mb-4">🎨</div>
                <p>create your first chart to see it here</p>
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
                    <div className={`p-2 bg-blue-100 rounded-lg border border-blue-300 mb-3 ${
                      isMaximized ? 'w-56' : 'w-40'
                    }`}>
                      <div className={`font-medium text-blue-800 mb-1 ${
                        isMaximized ? 'text-sm' : 'text-xs'
                      }`}>
                        🎯 {chart.title}
                      </div>
                      <div className="text-xs text-blue-600">
                        {chart.goal.content.slice(0, isMaximized ? 40 : 20)}{chart.goal.content.length > (isMaximized ? 40 : 20) ? '...' : ''}
                      </div>
                      <div className="text-xs text-blue-500 mt-1">
                        📅 {chart.goal.deadline.date.toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                    
                    {/* 矢印 - 縦方向 */}
                    <div className={`w-0.5 bg-gray-400 mx-auto mb-1 ${
                      isMaximized ? 'h-6' : 'h-4'
                    }`}></div>
                    <div className="w-2 h-2 bg-gray-400 transform rotate-45 mx-auto mb-1"></div>
                    
                    {/* C. アクションステップ */}
                    <div className={`space-y-1 mb-3 ${
                      isMaximized ? 'w-56' : 'w-40'
                    }`}>
                      {chart.actionSteps.slice(0, isMaximized ? 3 : 2).map((step, stepIndex) => (
                        <div key={step.id} className="p-2 bg-green-100 rounded border border-green-300">
                          <div className="text-xs font-medium text-green-800">
                            ⚡ Step {stepIndex + 1}
                          </div>
                          <div className="text-xs text-green-600">
                            {step.content.slice(0, isMaximized ? 30 : 15)}{step.content.length > (isMaximized ? 30 : 15) ? '...' : ''}
                          </div>
                          <div className="text-xs text-green-500">
                            👤 {step.responsiblePerson.name}
                          </div>
                        </div>
                      ))}
                      {chart.actionSteps.length > (isMaximized ? 3 : 2) && (
                        <div className="text-xs text-gray-500 text-center p-1">
                          +{chart.actionSteps.length - (isMaximized ? 3 : 2)} more...
                        </div>
                      )}
                    </div>
                    
                    {/* 矢印 - 縦方向 */}
                    <div className={`w-0.5 bg-gray-400 mx-auto mb-1 ${
                      isMaximized ? 'h-6' : 'h-4'
                    }`}></div>
                    <div className="w-2 h-2 bg-gray-400 transform rotate-45 mx-auto mb-1"></div>
                    
                    {/* B. 現実 */}
                    <div className={`p-2 bg-orange-100 rounded-lg border border-orange-300 ${
                      isMaximized ? 'w-56' : 'w-40'
                    }`}>
                      <div className={`font-medium text-orange-800 ${
                        isMaximized ? 'text-sm' : 'text-xs'
                      }`}>📊 現実</div>
                      <div className="text-xs text-orange-600 mt-1">
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

// AIチャットパネルコンポーネント
function AIChatPanel({ onToggleMaximize, isMaximized }: { onToggleMaximize: () => void, isMaximized: boolean }) {
  return (
    <div className="h-full bg-white border border-gray-200 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-purple-50 flex-shrink-0">
        <h2 className="font-semibold text-purple-800">🤖 AIチャット</h2>
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleMaximize()
          }}
          className="p-1 hover:bg-purple-200 rounded transition-colors text-lg cursor-pointer"
          title={isMaximized ? "最小化" : "最大化"}
        >
          {isMaximized ? '🔽' : '🔼'}
        </button>
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        {/* 2カラムチャット履歴 */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* 左カラム: ユーザーチャット履歴 */}
          <div className="flex-1 border-r border-gray-200 flex flex-col min-h-0">
            <div className="p-2 bg-blue-50 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-sm font-semibold text-blue-800">💬 あなたのメッセージ</h3>
            </div>
            <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-0">
              <div className="bg-blue-100 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    You
                  </div>
                  <span className="text-xs text-gray-500">14:25</span>
                </div>
                <p className="text-sm text-gray-800">
                  6月末までにプロトタイプを完成させたいです
                </p>
              </div>
              
              <div className="bg-blue-100 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    You
                  </div>
                  <span className="text-xs text-gray-500">14:30</span>
                </div>
                <p className="text-sm text-gray-800">
                  Next.js環境構築は完了しました。次は何をすべきでしょうか？
                </p>
              </div>
              
              <div className="bg-blue-100 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    You
                  </div>
                  <span className="text-xs text-gray-500">14:35</span>
                </div>
                <p className="text-sm text-gray-800">
                  3パネルレイアウトの実装をお願いします
                </p>
              </div>
            </div>
          </div>
          
          {/* 右カラム: AI回答履歴 */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-2 bg-purple-50 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-sm font-semibold text-purple-800">🤖 AI回答履歴</h3>
            </div>
            <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-0">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    AI
                  </div>
                  <span className="text-xs text-gray-500">14:25</span>
                </div>
                <p className="text-sm text-gray-800">
                  素晴らしい目標ですね！まずは現在の進捗状況を教えてください。どの部分まで完了していますか？
                </p>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    AI
                  </div>
                  <span className="text-xs text-gray-500">14:30</span>
                </div>
                <p className="text-sm text-gray-800">
                  次は3パネルレイアウトの実装に進みましょう。Notion風、MIRO風、AIチャットの3つのパネルを同時表示する設計を提案します。
                </p>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    AI
                  </div>
                  <span className="text-xs text-gray-500">14:35</span>
                </div>
                <p className="text-sm text-gray-800">
                  3パネルレイアウトを実装しました！各パネルの表示切り替えと最大化機能も含まれています。動作を確認してください。
                </p>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    AI
                  </div>
                  <span className="text-xs text-gray-500">進行中</span>
                </div>
                <p className="text-sm text-purple-800 font-medium">
                  💡 レイアウトの問題を修正しました！シンプルで安定したグリッドレイアウトに変更し、正常に動作するはずです。
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 入力エリア */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="メッセージを入力..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
              送信
            </button>
          </div>
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <span>💡 Tip: Enterキーで送信</span>
            <span>🔄 会話履歴: {new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
    </div>
  )
}