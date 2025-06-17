'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Calendar as CalendarIcon, List, Settings as SettingsIcon, Menu, X, ExternalLink } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Auth from '@/components/Auth'
import Calendar from '@/components/Calendar'
import DoManager from '@/components/DoManager'
import Settings from '@/components/Settings'
import CelebrationModal from '@/components/CelebrationModal'
import ConfirmationModal from '@/components/ConfirmationModal'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { 
  Do, 
  ActiveTab, 
  CelebrationModalState, 
  ConfirmationModalState
} from '@/types'
import { handleSupabaseError } from '@/utils/errorHandling'

export default function Home() {
  const { user, loading, sessionExpired, clearSessionExpired } = useAuth()
  const [activeTab, setActiveTab] = useState<ActiveTab>('calendar')
  const [dos, setDos] = useState<Do[]>([])
  const [celebrationModal, setCelebrationModal] = useState<CelebrationModalState>({
    isOpen: false,
    doTitle: '',
    date: '',
    doId: '',
    achievedDate: null,
  })
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalState>({
    isOpen: false,
    doId: '',
    doTitle: '',
    date: null,
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [calendarRefresh, setCalendarRefresh] = useState(0)
  const [error, setError] = useState('')

  const fetchDos = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const { data, error } = await supabase
        .from('dos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) {
        const { isSessionError, userMessage } = handleSupabaseError(error, 'Doの取得')
        if (isSessionError) return
        setError(userMessage)
        return
      }
      setDos(data || [])
      setError('')
    } catch (error) {
      const { userMessage } = handleSupabaseError(error, 'Doの取得')
      setError(userMessage)
    }
  }, [user?.id])

  useEffect(() => {
    if (user) {
      fetchDos()
    }
  }, [user, fetchDos])

  const handleAchievementToggle = async (doId: string, date: string, isAchieved: boolean, showConfirmation = true) => {
    if (!isAchieved) {
      // 未達成 -> 達成済みにする
      const doItem = dos.find(d => d.id === doId)
      if (doItem) {
        if (showConfirmation) {
          setConfirmationModal({
            isOpen: true,
            doId: doId,
            doTitle: doItem.title,
            date: new Date(date),
          })
        } else {
          // 直接達成記録を保存してからお祝いモーダルを表示
          try {
            const { error } = await supabase
              .from('achievements')
              .insert({
                user_id: user?.id,
                do_id: doId,
                achieved_date: date,
                memo: '',
              })

            if (error && error.code !== '23505') { // 重複エラー以外はログ出力
              console.error('Failed to add achievement:', error)
              return
            }

            // カレンダーの達成記録を更新してからモーダル表示
            setCalendarRefresh(prev => prev + 1)
            
            // 少し待ってからモーダル表示（データ更新を確実にするため）
            setTimeout(() => {
              setCelebrationModal({
                isOpen: true,
                doTitle: doItem.title,
                date: format(new Date(date), 'yyyy年MM月dd日', { locale: ja }),
                doId: doId,
                achievedDate: new Date(date),
              })
            }, 100)
          } catch (error) {
            console.error('Error adding achievement:', error)
          }
        }
      }
    } else {
      // 達成済み -> 削除する
      if (confirm('この達成記録を削除しますか？')) {
        try {
          const { error } = await supabase
            .from('achievements')
            .delete()
            .eq('user_id', user?.id)
            .eq('do_id', doId)
            .eq('achieved_date', date)

          if (error) {
            console.error('Failed to delete achievement:', error)
          } else {
            // カレンダーの達成記録を更新
            setCalendarRefresh(prev => prev + 1)
          }
        } catch (error) {
          console.error('Error deleting achievement:', error)
        }
      }
    }
  }

  const handleConfirmAchievement = async () => {
    if (!confirmationModal.date) return

    try {
      const dateString = format(confirmationModal.date, 'yyyy-MM-dd')
      
      // 既存の達成記録をチェック
      const { data: existingAchievement, error: checkError } = await supabase
        .from('achievements')
        .select('id')
        .eq('user_id', user?.id)
        .eq('do_id', confirmationModal.doId)
        .eq('achieved_date', dateString)
        .maybeSingle()

      if (checkError) {
        console.error('Error checking existing achievement:', checkError)
        if (checkError.message?.includes('JWT') || checkError.message?.includes('session')) {
          console.error('Session expired while checking achievement')
          return
        }
        // 406エラーやその他のエラーでも処理を続行
        console.warn('Continuing despite check error')
      }

      // 既に達成記録がある場合はそのままお祝いモーダルを表示
      if (existingAchievement) {
        console.log('Achievement already exists, showing celebration modal')
      } else {
        // 新しい達成記録を追加（メモフィールドを空文字で初期化）
        const { error } = await supabase
          .from('achievements')
          .insert({
            user_id: user?.id,
            do_id: confirmationModal.doId,
            achieved_date: dateString,
            memo: '',
          })

        if (error) {
          console.error('Database error details:', error)
          if (error.message?.includes('JWT') || error.message?.includes('session')) {
            console.error('Session expired while adding achievement')
            return
          }
          if (error.code === '23505') {
            // UNIQUE制約違反（重複）の場合は既に達成済みとして処理
            console.log('Achievement already exists (duplicate), showing celebration modal')
          } else {
            console.error('Failed to add achievement - Error code:', error.code, 'Message:', error.message)
            return
          }
        }
      }

      const doItem = dos.find(d => d.id === confirmationModal.doId)
      if (doItem) {
        setCelebrationModal({
          isOpen: true,
          doTitle: doItem.title,
          date: format(confirmationModal.date, 'yyyy年MM月dd日', { locale: ja }),
          doId: confirmationModal.doId,
          achievedDate: confirmationModal.date,
        })
        // カレンダーの達成記録を更新
        setCalendarRefresh(prev => prev + 1)
      }
    } catch (error) {
      console.error('Failed to add achievement:', error)
    }

    setConfirmationModal({
      isOpen: false,
      doId: '',
      doTitle: '',
      date: null,
    })
  }

  const handleCancelConfirmation = () => {
    setConfirmationModal({
      isOpen: false,
      doId: '',
      doTitle: '',
      date: null,
    })
  }

  const closeCelebrationModal = () => {
    setCelebrationModal({
      isOpen: false,
      doTitle: '',
      date: '',
      doId: '',
      achievedDate: null,
    })
  }

  const saveMemoToAchievement = async (doId: string, achievedDate: Date, memo: string) => {
    console.log('saveMemoToAchievement called with:', { doId, achievedDate, memo, userId: user?.id })
    
    try {
      const dateString = format(achievedDate, 'yyyy-MM-dd')
      console.log('Formatted date:', dateString)
      
      // 直接UPSERTを使用してメモを保存
      const { data, error } = await supabase
        .from('achievements')
        .upsert({
          user_id: user?.id,
          do_id: doId,
          achieved_date: dateString,
          memo: memo,
        }, {
          onConflict: 'user_id,do_id,achieved_date'
        })
        .select()

      console.log('Upsert result:', { data, error })

      if (error) {
        console.error('Failed to save memo:', error)
      } else {
        console.log('Memo saved successfully:', data)
        // カレンダーの達成記録を更新
        setCalendarRefresh(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error saving memo:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary-text">読み込み中...</div>
      </div>
    )
  }

  if (!user || sessionExpired) {
    return <Auth onSuccess={clearSessionExpired} />
  }

  const tabs = [
    { id: 'calendar' as const, label: 'カレンダー', icon: CalendarIcon },
    { id: 'dos' as const, label: 'Doリスト', icon: List },
    { id: 'settings' as const, label: '設定', icon: SettingsIcon },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Error Display */}
      {error && (
        <div className="bg-error/10 border border-error/20 text-error p-3 m-4 rounded-md">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={() => setError('')}
              className="text-error hover:text-error/80"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="lg:hidden bg-background border-b border-subtle-elements p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-accent" style={{ color: 'var(--color-accent)' }}>I did it!</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-secondary-text hover:text-primary-text transition-colors"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <div className="flex h-screen lg:h-auto">
        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-64 border-r border-subtle-elements transform transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0 lg:z-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ backgroundColor: 'var(--color-background)' }}>
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-subtle-elements">
              <h1 className="text-2xl font-bold text-accent" style={{ color: 'var(--color-accent)' }}>I did it!</h1>
              <p className="text-secondary-text text-sm mt-1">1日3DO</p>
            </div>

            <nav className="flex-1 p-4">
              <div className="space-y-2">
                {tabs.map(tab => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id)
                        setSidebarOpen(false)
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left cursor-pointer
                        ${activeTab === tab.id
                          ? 'text-white'
                          : 'text-primary-text hover:text-accent hover:scale-105'
                        }
                      `}
                      style={
                        activeTab === tab.id 
                          ? { backgroundColor: 'var(--color-accent)' }
                          : {}
                      }
                      onMouseEnter={(e) => {
                        if (activeTab !== tab.id) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 102, 0, 0.1)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== tab.id) {
                          e.currentTarget.style.backgroundColor = ''
                        }
                      }}
                    >
                      <Icon size={20} />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
              
              {/* Contact Form Link */}
              <div className="pt-4 border-t border-subtle-elements mt-4">
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSe_YKqI3FT0p_g4eUaV-UzzCvGVbQ6clJbKYulR2LeQmlhLcg/viewform?usp=dialog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left cursor-pointer text-primary-text hover:text-accent hover:scale-105"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 102, 0, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = ''
                  }}
                >
                  <ExternalLink size={20} />
                  連絡フォーム
                </a>
              </div>
            </nav>
          </div>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          <div className="p-6 max-w-6xl mx-auto">
            {activeTab === 'calendar' && (
              <Calendar 
                dos={dos} 
                onAchievementToggle={handleAchievementToggle}
                refreshTrigger={calendarRefresh}
              />
            )}
            {activeTab === 'dos' && <DoManager />}
            {activeTab === 'settings' && <Settings />}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={handleCancelConfirmation}
        onConfirm={handleConfirmAchievement}
        doTitle={confirmationModal.doTitle}
        date={confirmationModal.date ? format(confirmationModal.date, 'yyyy年MM月dd日', { locale: ja }) : ''}
      />

      {/* Celebration Modal */}
      <CelebrationModal
        isOpen={celebrationModal.isOpen}
        onClose={closeCelebrationModal}
        onSaveMemo={(memo) => {
          if (celebrationModal.doId && celebrationModal.achievedDate) {
            saveMemoToAchievement(celebrationModal.doId, celebrationModal.achievedDate, memo)
          }
        }}
        doTitle={celebrationModal.doTitle}
        date={celebrationModal.date}
      />
    </div>
  )
}
