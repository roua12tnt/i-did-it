// 共通型定義
export interface Do {
  id: string
  title: string
  description: string | null
}

export interface Achievement {
  id: string
  user_id: string
  do_id: string
  achieved_date: string
  memo?: string | null
  created_at: string
}

export interface Profile {
  id: string
  email: string
  birthday?: string | null
  selected_message_set_id?: string | null
  created_at: string
  updated_at: string
}

export interface MessageSet {
  id: string
  name: string
  description?: string | null
  created_at: string
}

export interface PraiseMessage {
  id: string
  set_id: string
  message: string
  created_at: string
}

// UI関連の型
export type ActiveTab = 'calendar' | 'dos' | 'settings'

export interface CelebrationModalState {
  isOpen: boolean
  doTitle: string
  date: string
  doId: string
  achievedDate: Date | null
}

export interface ConfirmationModalState {
  isOpen: boolean
  doId: string
  doTitle: string
  date: Date | null
}

// 定数
export const MEMO_MAX_LENGTH = 200
export const MAX_DOS_PER_USER = 3
export const CONFIRMATION_MODAL_PROBABILITY = 0.3