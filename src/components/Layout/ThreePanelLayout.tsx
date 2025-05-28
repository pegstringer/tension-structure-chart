'use client'

import { useState } from 'react'

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
  const maximizedPanel = Object.entries(panelStates).find(([_, state]) => state.maximized)?.[0] as PanelType

  // 表示されているパネルの数を計算
  const visiblePanels = Object.values(panelStates).filter(state => state.visible).length

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
      <main className="flex-1 overflow-hidden flex flex-col">
        {hasMaximizedPanel ? (
          // 最大化モード - 1つのパネルのみ表示
          <div className="h-full">
            {maximizedPanel === 'notion' && panelStates.notion.visible && (
              <NotionPanel 
                onToggleMaximize={() => toggleMaximize('notion')}
                isMaximized={true}
              />
            )}
            {maximizedPanel === 'miro' && panelStates.miro.visible && (
              <MiroPanel 
                onToggleMaximize={() => toggleMaximize('miro')}
                isMaximized={true}
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
          <>
            {/* 上部: Notion風とMIRO風のパネル */}
            <div className="flex-1 overflow-hidden">
              <div className={`h-full grid gap-2 p-2 ${getTopPanelsGridLayout()}`}>
                {panelStates.notion.visible && (
                  <NotionPanel 
                    onToggleMaximize={() => toggleMaximize('notion')}
                    isMaximized={false}
                  />
                )}
                {panelStates.miro.visible && (
                  <MiroPanel 
                    onToggleMaximize={() => toggleMaximize('miro')}
                    isMaximized={false}
                  />
                )}
              </div>
            </div>
            
            {/* 下部: AIチャットパネル */}
            {panelStates['ai-chat'].visible && (
              <div className="h-96 p-2 pt-0 flex">
                <AIChatPanel 
                  onToggleMaximize={() => toggleMaximize('ai-chat')}
                  isMaximized={false}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

// 表示パネル数に応じたグリッドレイアウトを決定
function getGridLayout(visibleCount: number): string {
  switch (visibleCount) {
    case 1:
      return 'grid-cols-1'
    case 2:
      return 'grid-cols-1 lg:grid-cols-2'
    case 3:
      return 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
    default:
      return 'grid-cols-1'
  }
}

// 上部パネル（Notion風・MIRO風）のグリッドレイアウトを決定
function getTopPanelsGridLayout(): string {
  return 'grid-cols-1 lg:grid-cols-2'
}

// Notion風パネルコンポーネント
function NotionPanel({ onToggleMaximize, isMaximized }: { onToggleMaximize: () => void, isMaximized: boolean }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-blue-50">
        <h2 className="font-semibold text-blue-800">📝 Notion風リスト</h2>
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
      </div>
      <div className="flex-1 p-4 overflow-auto">
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">🎯 メインチャート: プロトタイプ完成</h3>
            <div className="ml-4 space-y-2 text-sm">
              <div className="text-blue-600">💡 創り出したいもの: 6月末までにプロトタイプ完成</div>
              <div className="text-orange-600">📊 現実: Next.js環境構築完了、基本UI開発中</div>
              <div className="text-green-600">⚡ アクションステップ:</div>
              <div className="ml-6 space-y-1">
                <div>• 3パネルレイアウト実装 ✅</div>
                <div>• チャート表示機能開発</div>
                <div>• 3階層構造実装</div>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">📊 サブチャート: UI実装</h3>
            <div className="ml-4 space-y-2 text-sm">
              <div className="text-blue-600">💡 創り出したいもの: 使いやすい3パネルUI</div>
              <div className="text-orange-600">📊 現実: レイアウト基本形完成</div>
              <div className="text-green-600">⚡ アクションステップ:</div>
              <div className="ml-6 space-y-1">
                <div>• リサイズ機能追加</div>
                <div>• ドラッグ&ドロップ対応</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// MIRO風パネルコンポーネント
function MiroPanel({ onToggleMaximize, isMaximized }: { onToggleMaximize: () => void, isMaximized: boolean }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-green-50">
        <h2 className="font-semibold text-green-800">🎨 MIRO風キャンバス</h2>
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
      <div className="flex-1 p-4 overflow-auto bg-gray-50">
        <div className="relative w-full h-96 bg-white rounded-lg border-2 border-dashed border-gray-300">
          {/* チャート要素のモック */}
          <div className="absolute top-8 left-8 w-48 p-3 bg-blue-100 rounded-lg border border-blue-300">
            <div className="text-sm font-medium text-blue-800">🎯 プロトタイプ完成</div>
            <div className="text-xs text-blue-600 mt-1">期日: 2025-06-30</div>
          </div>
          
          {/* 矢印 */}
          <div className="absolute top-20 left-64 w-8 h-0.5 bg-gray-400"></div>
          <div className="absolute top-19 left-70 w-2 h-2 bg-gray-400 transform rotate-45"></div>
          
          <div className="absolute top-8 left-80 w-48 p-3 bg-orange-100 rounded-lg border border-orange-300">
            <div className="text-sm font-medium text-orange-800">📊 現在の状況</div>
            <div className="text-xs text-orange-600 mt-1">環境構築完了</div>
          </div>
          
          <div className="absolute top-32 left-32 w-48 p-3 bg-green-100 rounded-lg border border-green-300">
            <div className="text-sm font-medium text-green-800">⚡ 3パネルUI実装</div>
            <div className="text-xs text-green-600 mt-1">進行中</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// AIチャットパネルコンポーネント
function AIChatPanel({ onToggleMaximize, isMaximized }: { onToggleMaximize: () => void, isMaximized: boolean }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden w-full h-full">
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
                  💡 現在、AIチャットのレイアウトを改善中です。左右2カラム表示で会話履歴をより見やすくしています。
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