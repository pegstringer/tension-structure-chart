// 緊張構造チャート管理アプリ - 型定義
// Created: 2025-05-29

/**
 * チャートの状態
 */
export type ChartStatus = 'not_started' | 'in_progress' | 'completed'

/**
 * 責任者情報
 */
export interface ResponsiblePerson {
  id: string
  name: string
  email?: string
  role?: string
}

/**
 * 期日情報
 */
export interface Deadline {
  date: Date
  time?: string // HH:MM形式（オプション）
  timezone?: string // デフォルトはAsia/Tokyo
}

/**
 * 変更履歴の基本型
 */
export interface ChangeRecord {
  id: string
  timestamp: Date
  changedBy: string // ユーザーID or システム
  changeType: 'created' | 'updated' | 'deleted' | 'status_changed'
  previousValue?: string | number | boolean | object
  newValue?: string | number | boolean | object
  notes?: string
}

/**
 * A. 創り出したいもの
 */
export interface CreativeGoal {
  id: string
  content: string // 達成したい理想の状態
  deadline: Deadline // 必須
  responsiblePerson: ResponsiblePerson // 完了を見届ける人（必須）
  description?: string // 詳細説明
  tags?: string[] // タグ
  createdAt: Date
  updatedAt: Date
  changeHistory: ChangeRecord[]
}

/**
 * B. 創り出したいものから見た今の現実
 */
export interface CurrentReality {
  id: string
  content: string // 現在の状況の客観的認識
  recordedAt: Date // 現実を記述・更新した日時（必須）
  description?: string // 詳細な現状分析
  evidences?: string[] // 現実を裏付ける証拠・データ
  tags?: string[]
  createdAt: Date
  updatedAt: Date
  changeHistory: ChangeRecord[]
}

/**
 * C. アクションステップ
 */
export interface ActionStep {
  id: string
  content: string // 具体的な行動計画
  deadline: Deadline // 必須
  responsiblePerson: ResponsiblePerson // 実行・完了確認責任者（必須）
  status: ChartStatus
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  estimatedHours?: number // 見積もり時間
  actualHours?: number // 実績時間
  dependencies?: string[] // 依存する他のアクションステップのID
  description?: string
  tags?: string[]
  createdAt: Date
  updatedAt: Date
  changeHistory: ChangeRecord[]
}

/**
 * 緊張構造チャート（基本単位）
 */
export interface TensionStructureChart {
  id: string
  title: string // チャートの名前
  goal: CreativeGoal // A. 創り出したいもの
  reality: CurrentReality // B. 現実
  actionSteps: ActionStep[] // C. アクションステップ群
  
  // 階層構造管理
  parentChartId?: string // 親チャートのID
  childChartIds: string[] // 子チャートのID群
  level: number // 階層レベル（0がルート）
  
  // チャート全体の状態
  status: ChartStatus
  
  // メタデータ
  createdAt: Date
  updatedAt: Date
  createdBy: string // 作成者ID
  lastModifiedBy: string // 最終更新者ID
  
  // 組織管理（将来対応）
  organizationId?: string
  teamId?: string
  visibility: 'private' | 'team' | 'organization' | 'public'
  
  // その他
  description?: string
  tags?: string[]
  archived: boolean // アーカイブ状態
  changeHistory: ChangeRecord[]
}

/**
 * チャートツリー（階層構造全体）
 */
export interface ChartTree {
  id: string
  rootChartId: string // ルートチャートのID
  allChartIds: string[] // ツリーに含まれる全チャートのID
  title: string // ツリー全体の名前
  description?: string
  createdAt: Date
  updatedAt: Date
  tags?: string[]
}

/**
 * プロジェクト（複数のチャートツリーを管理）
 */
export interface Project {
  id: string
  name: string
  description?: string
  chartTreeIds: string[] // 含まれるチャートツリーのID群
  status: ChartStatus
  startDate?: Date
  endDate?: Date
  responsiblePerson: ResponsiblePerson
  organizationId?: string
  teamId?: string
  createdAt: Date
  updatedAt: Date
  tags?: string[]
}

/**
 * ダッシュボード用の集計データ
 */
export interface DashboardSummary {
  totalCharts: number
  chartsByStatus: Record<ChartStatus, number>
  overdueTasks: number
  upcomingDeadlines: ActionStep[]
  recentlyUpdated: TensionStructureChart[]
  stagnantCharts: TensionStructureChart[] // 長期間更新されていないチャート
  responsiblePersonWorkload: Record<string, number> // 責任者別タスク数
}

/**
 * 検索・フィルタリング条件
 */
export interface SearchFilters {
  query?: string // フリーテキスト検索
  status?: ChartStatus[]
  responsiblePersonIds?: string[]
  tags?: string[]
  dateRange?: {
    start: Date
    end: Date
    type: 'created' | 'updated' | 'deadline'
  }
  level?: number[] // 階層レベル
}

/**
 * UI状態管理
 */
export interface UIState {
  selectedChartId?: string
  expandedChartIds: string[] // 展開されているチャートのID
  viewMode: 'list' | 'tree' | 'kanban' | 'timeline'
  panelStates: {
    notion: { visible: boolean; maximized: boolean }
    miro: { visible: boolean; maximized: boolean }
    aiChat: { visible: boolean; maximized: boolean }
  }
  filters: SearchFilters
  sortBy: 'title' | 'created' | 'updated' | 'deadline' | 'status'
  sortOrder: 'asc' | 'desc'
}

/**
 * アプリケーション全体の状態
 */
export interface AppState {
  charts: Record<string, TensionStructureChart> // ID -> Chart
  chartTrees: Record<string, ChartTree> // ID -> ChartTree
  projects: Record<string, Project> // ID -> Project
  responsiblePersons: Record<string, ResponsiblePerson> // ID -> Person
  ui: UIState
  user: {
    id: string
    name: string
    email: string
    organizationId?: string
    teamId?: string
  }
  settings: {
    timezone: string
    dateFormat: string
    notifications: boolean
    autoSave: boolean
    theme: 'light' | 'dark' | 'auto'
  }
}

/**
 * API レスポンス型
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: Date
}

/**
 * バリデーション結果
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * エクスポート・インポート用の型
 */
export interface ExportData {
  version: string
  exportedAt: Date
  charts: TensionStructureChart[]
  chartTrees: ChartTree[]
  projects: Project[]
  metadata: {
    appVersion: string
    totalItems: number
  }
}
