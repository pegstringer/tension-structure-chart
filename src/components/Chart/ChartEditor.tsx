'use client'

import { useState } from 'react'
import { Plus, Calendar, User, Save, X } from 'lucide-react'
import type { TensionStructureChart, ActionStep } from '@/types'

interface ChartEditorProps {
  chart?: TensionStructureChart | null
  onSave?: (chart: TensionStructureChart) => void
  onCancel?: () => void
  isMaximized?: boolean
  isDarkMode?: boolean
}

interface ThemeClasses {
  mainBg: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  inputBg: string
  sectionBg: string
  previewBg: string
}

export default function ChartEditor({ chart, onSave, onCancel, isMaximized = false, isDarkMode = true }: ChartEditorProps) {
  // フォーム状態の初期化
  const [title, setTitle] = useState(chart?.title || '')
  
  // A. 創り出したいもの
  const [goalContent, setGoalContent] = useState(chart?.goal.content || '')
  const [goalDeadline, setGoalDeadline] = useState(() => {
    if (chart?.goal.deadline.date) {
      const date = new Date(chart.goal.deadline.date)
      return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0]
    }
    return ''
  })
  const [goalResponsible, setGoalResponsible] = useState(chart?.goal.responsiblePerson.name || '')
  
  // B. 現実
  const [realityContent, setRealityContent] = useState(chart?.reality.content || '')
  
  // C. アクションステップ
  const [actionSteps, setActionSteps] = useState<Partial<ActionStep>[]>(() => {
    if (chart?.actionSteps && chart.actionSteps.length > 0) {
      return chart.actionSteps.map(step => ({
        ...step,
        deadline: {
          date: step.deadline?.date ? new Date(step.deadline.date) : new Date()
        }
      }))
    }
    return [{ 
      content: '', 
      deadline: { date: new Date() }, 
      responsiblePerson: { id: '', name: '' }, 
      status: 'not_started' 
    }]
  })

  // アクションステップを追加
  const addActionStep = () => {
    setActionSteps([
      ...actionSteps,
      {
        content: '',
        deadline: { date: new Date() },
        responsiblePerson: { id: '', name: '' },
        status: 'not_started'
      }
    ])
  }

  // アクションステップを削除
  const removeActionStep = (index: number) => {
    setActionSteps(actionSteps.filter((_, i) => i !== index))
  }

  // アクションステップを更新
  const updateActionStep = (index: number, field: string, value: string | Date) => {
    const updated = [...actionSteps]
    if (field === 'deadline') {
      // 日付のバリデーション
      const date = new Date(value)
      if (isNaN(date.getTime())) {
        // 不正な日付の場合は現在の日付を使用
        console.warn('Invalid date provided:', value)
        updated[index] = {
          ...updated[index],
          deadline: { date: new Date() }
        }
      } else {
        updated[index] = {
          ...updated[index],
          deadline: { date }
        }
      }
    } else if (field === 'responsible') {
      updated[index] = {
        ...updated[index],
        responsiblePerson: { id: value as string, name: value as string }
      }
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value
      }
    }
    setActionSteps(updated)
  }

  // テーマに応じたスタイル関数
  const getThemeClasses = (): ThemeClasses => {
    if (isDarkMode) {
      return {
        mainBg: 'bg-gradient-to-br from-slate-800 to-slate-900',
        textPrimary: 'text-white',
        textSecondary: 'text-slate-200',
        textMuted: 'text-slate-400',
        inputBg: 'bg-slate-700/50 border-slate-500 text-white placeholder-slate-400',
        sectionBg: 'backdrop-blur-sm rounded-xl border shadow-lg',
        previewBg: 'bg-slate-700/30 border-slate-600'
      }
    } else {
      return {
        mainBg: 'bg-white',
        textPrimary: 'text-gray-800',
        textSecondary: 'text-gray-700',
        textMuted: 'text-gray-500',
        inputBg: 'bg-white border-gray-300 text-gray-800 placeholder-gray-500',
        sectionBg: 'rounded-xl border shadow-md',
        previewBg: 'bg-gray-50 border-gray-200'
      }
    }
  }

  const theme = getThemeClasses()
  const handleSave = () => {
    // 基本的な必須項目のみチェック（期日・責任者は任意）
    if (!title || !goalContent || !realityContent) {
      alert('タイトル、創り出したいもの、現実は必須項目です')
      return
    }

    const now = new Date()
    
    // ゴールの期日をバリデーション（未設定の場合は1ヶ月後をデフォルト）
    let goalDate = now
    if (goalDeadline) {
      const parsedDate = new Date(goalDeadline)
      if (!isNaN(parsedDate.getTime())) {
        goalDate = parsedDate
      }
    } else {
      // デフォルト: 1ヶ月後
      goalDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    }

    const newChart: TensionStructureChart = {
      id: chart?.id || `chart_${Date.now()}`,
      title,
      goal: {
        id: chart?.goal.id || `goal_${Date.now()}`,
        content: goalContent,
        deadline: {
          date: goalDate,
          timezone: 'Asia/Tokyo'
        },
        responsiblePerson: {
          id: goalResponsible || 'unassigned',
          name: goalResponsible || '未設定'
        },
        createdAt: chart?.goal.createdAt || now,
        updatedAt: now,
        changeHistory: []
      },
      reality: {
        id: chart?.reality.id || `reality_${Date.now()}`,
        content: realityContent,
        recordedAt: now,
        createdAt: chart?.reality.createdAt || now,
        updatedAt: now,
        changeHistory: []
      },
      actionSteps: actionSteps
        .filter(step => step.content)
        .map((step, index) => {
          // アクションステップの日付をバリデーション
          let stepDate = now
          if (step.deadline?.date) {
            const date = new Date(step.deadline.date)
            if (!isNaN(date.getTime())) {
              stepDate = date
            }
          }
          
          return {
            id: `action_${Date.now()}_${index}`,
            content: step.content!,
            deadline: { date: stepDate, timezone: 'Asia/Tokyo' },
            responsiblePerson: step.responsiblePerson!,
            status: step.status || 'not_started',
            createdAt: now,
            updatedAt: now,
            changeHistory: []
          }
        }),
      parentChartId: chart?.parentChartId,
      childChartIds: chart?.childChartIds || [],
      level: chart?.level || 0,
      status: 'in_progress',
      createdAt: chart?.createdAt || now,
      updatedAt: now,
      createdBy: 'user',
      lastModifiedBy: 'user',
      visibility: 'private',
      archived: false,
      changeHistory: []
    }

    onSave?.(newChart)
  }

  return (
    <div className={`${
      isMaximized 
        ? `w-full p-6 ${theme.mainBg} backdrop-blur-sm` 
        : `max-w-4xl mx-auto p-6 ${theme.mainBg} rounded-2xl shadow-2xl ${isDarkMode ? 'border border-slate-600' : 'border border-gray-200'} backdrop-blur-sm`
    }`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-bold ${theme.textPrimary} drop-shadow-sm`}>
          {chart ? 'チャート編集' : '新規チャート作成'}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-400 hover:to-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Save size={16} />
            保存
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className={`flex items-center gap-2 px-4 py-2 ${isDarkMode ? 'bg-slate-600 hover:bg-slate-500' : 'bg-gray-500 hover:bg-gray-600'} text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105`}
            >
              <X size={16} />
              キャンセル
            </button>
          )}
        </div>
      </div>

      {/* チャートタイトル */}
      <div className="mb-6">
        <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
          チャートタイトル *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: プロトタイプ完成プロジェクト"
          className={`w-full px-3 py-2 border ${theme.inputBg} backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400`}
        />
      </div>

      {/* A. 創り出したいもの */}
      <div className={`mb-8 p-4 ${isDarkMode ? 'bg-blue-500/20 border-blue-400/50' : 'bg-blue-50 border-blue-200'} ${theme.sectionBg}`}>
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-blue-200' : 'text-blue-800'} mb-4 flex items-center gap-2`}>
          🎯 A. 創り出したいもの
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
              内容 *
            </label>
            <textarea
              value={goalContent}
              onChange={(e) => setGoalContent(e.target.value)}
              placeholder="達成したい理想の状態を具体的に記述してください"
              rows={3}
              className={`w-full px-3 py-2 border ${theme.inputBg} backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400`}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-2 flex items-center gap-1`}>
                <Calendar size={16} />
                期日
              </label>
              <input
                type="date"
                value={goalDeadline}
                onChange={(e) => setGoalDeadline(e.target.value)}
                className={`w-full px-3 py-2 border ${theme.inputBg} backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400`}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-2 flex items-center gap-1`}>
                <User size={16} />
                責任者
              </label>
              <input
                type="text"
                value={goalResponsible}
                onChange={(e) => setGoalResponsible(e.target.value)}
                placeholder="完了を見届ける人（未設定可）"
                className={`w-full px-3 py-2 border ${theme.inputBg} backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* B. 現実 */}
      <div className={`mb-8 p-4 ${isDarkMode ? 'bg-orange-500/20 border-orange-400/50' : 'bg-orange-50 border-orange-200'} ${theme.sectionBg}`}>
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-orange-200' : 'text-orange-800'} mb-4 flex items-center gap-2`}>
          📊 B. 創り出したいものから見た今の現実
        </h3>
        
        <div>
          <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
            現在の状況 *
          </label>
          <textarea
            value={realityContent}
            onChange={(e) => setRealityContent(e.target.value)}
            placeholder="現在の状況を客観的に記述してください"
            rows={3}
            className={`w-full px-3 py-2 border ${theme.inputBg} backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-400`}
          />
          <p className={`text-xs ${theme.textMuted} mt-1`}>
            記録日時: {new Date().toLocaleString('ja-JP')}
          </p>
        </div>
      </div>

      {/* C. アクションステップ */}
      <div className={`mb-8 p-4 ${isDarkMode ? 'bg-emerald-500/20 border-emerald-400/50' : 'bg-emerald-50 border-emerald-200'} ${theme.sectionBg}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-emerald-200' : 'text-emerald-800'} flex items-center gap-2`}>
            ⚡ C. アクションステップ
          </h3>
          <button
            onClick={addActionStep}
            className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg text-sm hover:from-emerald-400 hover:to-emerald-500 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
          >
            <Plus size={14} />
            追加
          </button>
        </div>

        <div className="space-y-4">
          {actionSteps.map((step, index) => (
            <div key={index} className={`p-3 ${isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-white border-gray-200'} backdrop-blur-sm rounded-xl border shadow-lg`}>
              <div className="flex items-start justify-between mb-3">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-emerald-200' : 'text-emerald-800'}`}>
                  ステップ {index + 1}
                </span>
                {actionSteps.length > 1 && (
                  <button
                    onClick={() => removeActionStep(index)}
                    className={`${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'} transition-colors hover:scale-110`}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <textarea
                    value={step.content || ''}
                    onChange={(e) => updateActionStep(index, 'content', e.target.value)}
                    placeholder="具体的な行動計画を記述してください"
                    rows={2}
                    className={`w-full px-3 py-2 border ${isDarkMode ? 'border-slate-500 bg-slate-600/50' : 'border-gray-300 bg-white'} backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 ${isDarkMode ? 'text-white placeholder-slate-400' : 'text-gray-800 placeholder-gray-500'}`}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-600'} mb-1`}>期日</label>
                    <input
                      type="date"
                      value={(() => {
                        if (!step.deadline?.date) return ''
                        const date = new Date(step.deadline.date)
                        return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0]
                      })()}
                      onChange={(e) => updateActionStep(index, 'deadline', e.target.value)}
                      className={`w-full px-2 py-1 border ${isDarkMode ? 'border-slate-500 bg-slate-600/50 text-white' : 'border-gray-300 bg-white text-gray-800'} backdrop-blur-sm rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-400`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-600'} mb-1`}>責任者</label>
                    <input
                      type="text"
                      value={step.responsiblePerson?.name || ''}
                      onChange={(e) => updateActionStep(index, 'responsible', e.target.value)}
                      placeholder="実行責任者"
                      className={`w-full px-2 py-1 border ${isDarkMode ? 'border-slate-500 bg-slate-600/50 text-white placeholder-slate-400' : 'border-gray-300 bg-white text-gray-800 placeholder-gray-500'} backdrop-blur-sm rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-400`}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* プレビュー */}
      <div className={`mb-6 p-4 ${theme.previewBg} ${theme.sectionBg}`}>
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-3`}>📋 プレビュー</h3>
        <div className={`text-sm ${theme.textSecondary} space-y-3`}>
          <div><strong className={theme.textPrimary}>タイトル:</strong> {title || '（未入力）'}</div>
          
          <div className="border-l-4 border-blue-500 pl-3">
            <div><strong className={theme.textPrimary}>🎯 A. 創り出したいもの:</strong></div>
            <div className={`ml-4 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>{goalContent || '（未入力）'}</div>
            {goalDeadline && <div className={`ml-4 text-xs ${theme.textMuted}`}>📅 期日: {goalDeadline}</div>}
            {goalResponsible && <div className={`ml-4 text-xs ${theme.textMuted}`}>👤 責任者: {goalResponsible}</div>}
          </div>
          
          <div className="border-l-4 border-orange-500 pl-3">
            <div><strong className={theme.textPrimary}>📊 B. 現実:</strong></div>
            <div className={`ml-4 ${isDarkMode ? 'text-orange-300' : 'text-orange-600'}`}>{realityContent || '（未入力）'}</div>
          </div>
          
          <div className="border-l-4 border-emerald-500 pl-3">
            <div><strong className={theme.textPrimary}>⚡ C. アクションステップ:</strong></div>
            <div className={`ml-4 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-600'}`}>{actionSteps.filter(s => s.content).length}個のステップ</div>
            {actionSteps.filter(s => s.content).length > 0 && (
              <div className="ml-4 mt-1 space-y-1">
                {actionSteps.filter(s => s.content).slice(0, 3).map((step, index) => (
                  <div key={index} className={`text-xs ${theme.textMuted}`}>
                    • {step.content?.slice(0, 30)}{step.content && step.content.length > 30 ? '...' : ''}
                  </div>
                ))}
                {actionSteps.filter(s => s.content).length > 3 && (
                  <div className={`text-xs ${theme.textMuted}`}>... 他{actionSteps.filter(s => s.content).length - 3}個</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}