'use client'

import { useState } from 'react'
import { Plus, Calendar, User, Save, X } from 'lucide-react'
import type { TensionStructureChart, CreativeGoal, CurrentReality, ActionStep, ResponsiblePerson, Deadline } from '@/types'

interface ChartEditorProps {
  chart?: TensionStructureChart
  onSave?: (chart: TensionStructureChart) => void
  onCancel?: () => void
  isMaximized?: boolean
}

export default function ChartEditor({ chart, onSave, onCancel, isMaximized = false }: ChartEditorProps) {
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
  const updateActionStep = (index: number, field: string, value: any) => {
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
        responsiblePerson: { id: value, name: value }
      }
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value
      }
    }
    setActionSteps(updated)
  }

  // 保存処理
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
        ? 'w-full p-6 bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-sm' 
        : 'max-w-4xl mx-auto p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-600 backdrop-blur-sm'
    }`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white drop-shadow-sm">
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
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
            >
              <X size={16} />
              キャンセル
            </button>
          )}
        </div>
      </div>

      {/* チャートタイトル */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-200 mb-2">
          チャートタイトル *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: プロトタイプ完成プロジェクト"
          className="w-full px-3 py-2 border border-slate-500 bg-slate-700/50 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 text-white placeholder-slate-400"
        />
      </div>

      {/* A. 創り出したいもの */}
      <div className="mb-8 p-4 bg-blue-500/20 backdrop-blur-sm rounded-xl border border-blue-400/50 shadow-lg">
        <h3 className="text-lg font-semibold text-blue-200 mb-4 flex items-center gap-2">
          🎯 A. 創り出したいもの
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              内容 *
            </label>
            <textarea
              value={goalContent}
              onChange={(e) => setGoalContent(e.target.value)}
              placeholder="達成したい理想の状態を具体的に記述してください"
              rows={3}
              className="w-full px-3 py-2 border border-slate-500 bg-slate-700/50 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 text-white placeholder-slate-400"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2 flex items-center gap-1">
                <Calendar size={16} />
                期日
              </label>
              <input
                type="date"
                value={goalDeadline}
                onChange={(e) => setGoalDeadline(e.target.value)}
                className="w-full px-3 py-2 border border-slate-500 bg-slate-700/50 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2 flex items-center gap-1">
                <User size={16} />
                責任者
              </label>
              <input
                type="text"
                value={goalResponsible}
                onChange={(e) => setGoalResponsible(e.target.value)}
                placeholder="完了を見届ける人（未設定可）"
                className="w-full px-3 py-2 border border-slate-500 bg-slate-700/50 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 text-white placeholder-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* B. 現実 */}
      <div className="mb-8 p-4 bg-orange-500/20 backdrop-blur-sm rounded-xl border border-orange-400/50 shadow-lg">
        <h3 className="text-lg font-semibold text-orange-200 mb-4 flex items-center gap-2">
          📊 B. 創り出したいものから見た今の現実
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">
            現在の状況 *
          </label>
          <textarea
            value={realityContent}
            onChange={(e) => setRealityContent(e.target.value)}
            placeholder="現在の状況を客観的に記述してください"
            rows={3}
            className="w-full px-3 py-2 border border-slate-500 bg-slate-700/50 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-400 text-white placeholder-slate-400"
          />
          <p className="text-xs text-slate-400 mt-1">
            記録日時: {new Date().toLocaleString('ja-JP')}
          </p>
        </div>
      </div>

      {/* C. アクションステップ */}
      <div className="mb-8 p-4 bg-emerald-500/20 backdrop-blur-sm rounded-xl border border-emerald-400/50 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-emerald-200 flex items-center gap-2">
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
            <div key={index} className="p-3 bg-slate-700/50 backdrop-blur-sm rounded-xl border border-slate-600 shadow-lg">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-emerald-200">
                  ステップ {index + 1}
                </span>
                {actionSteps.length > 1 && (
                  <button
                    onClick={() => removeActionStep(index)}
                    className="text-red-400 hover:text-red-300 transition-colors hover:scale-110"
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
                    className="w-full px-3 py-2 border border-slate-500 bg-slate-600/50 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-slate-400"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">期日</label>
                    <input
                      type="date"
                      value={(() => {
                        if (!step.deadline?.date) return ''
                        const date = new Date(step.deadline.date)
                        return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0]
                      })()}
                      onChange={(e) => updateActionStep(index, 'deadline', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-500 bg-slate-600/50 backdrop-blur-sm rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-400 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">責任者</label>
                    <input
                      type="text"
                      value={step.responsiblePerson?.name || ''}
                      onChange={(e) => updateActionStep(index, 'responsible', e.target.value)}
                      placeholder="実行責任者"
                      className="w-full px-2 py-1 border border-slate-500 bg-slate-600/50 backdrop-blur-sm rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* プレビュー */}
      <div className="mb-6 p-4 bg-slate-700/30 backdrop-blur-sm rounded-xl border border-slate-600 shadow-lg">
        <h3 className="text-lg font-semibold text-slate-200 mb-3">📋 プレビュー</h3>
        <div className="text-sm text-slate-300 space-y-3">
          <div><strong className="text-white">タイトル:</strong> {title || '（未入力）'}</div>
          
          <div className="border-l-4 border-blue-500 pl-3">
            <div><strong className="text-white">🎯 A. 創り出したいもの:</strong></div>
            <div className="ml-4 text-blue-300">{goalContent || '（未入力）'}</div>
            {goalDeadline && <div className="ml-4 text-xs text-slate-400">📅 期日: {goalDeadline}</div>}
            {goalResponsible && <div className="ml-4 text-xs text-slate-400">👤 責任者: {goalResponsible}</div>}
          </div>
          
          <div className="border-l-4 border-orange-500 pl-3">
            <div><strong className="text-white">📊 B. 現実:</strong></div>
            <div className="ml-4 text-orange-300">{realityContent || '（未入力）'}</div>
          </div>
          
          <div className="border-l-4 border-emerald-500 pl-3">
            <div><strong className="text-white">⚡ C. アクションステップ:</strong></div>
            <div className="ml-4 text-emerald-300">{actionSteps.filter(s => s.content).length}個のステップ</div>
            {actionSteps.filter(s => s.content).length > 0 && (
              <div className="ml-4 mt-1 space-y-1">
                {actionSteps.filter(s => s.content).slice(0, 3).map((step, index) => (
                  <div key={index} className="text-xs text-slate-400">
                    • {step.content?.slice(0, 30)}{step.content && step.content.length > 30 ? '...' : ''}
                  </div>
                ))}
                {actionSteps.filter(s => s.content).length > 3 && (
                  <div className="text-xs text-slate-500">... 他{actionSteps.filter(s => s.content).length - 3}個</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}