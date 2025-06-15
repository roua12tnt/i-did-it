'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Calendar as CalendarIcon, List, Settings as SettingsIcon, Menu, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Auth from '@/components/Auth'
import Calendar from '@/components/Calendar'
import DoManager from '@/components/DoManager'
import Settings from '@/components/Settings'
import CelebrationModal from '@/components/CelebrationModal'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Do {
  id: string
  title: string
  description: string | null
}

type ActiveTab = 'calendar' | 'dos' | 'settings'

export default function Home() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<ActiveTab>('calendar')
  const [dos, setDos] = useState<Do[]>([])
  const [celebrationModal, setCelebrationModal] = useState<{
    isOpen: boolean
    doTitle: string
    date: string
  }>({
    isOpen: false,
    doTitle: '',
    date: '',
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const fetchDos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('dos')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setDos(data || [])
    } catch (error) {
      console.error('Failed to fetch dos:', error)
    }
  }, [user?.id])

  useEffect(() => {
    if (user) {
      fetchDos()
    }
  }, [user, fetchDos])

  const handleAchievementToggle = (doId: string, date: string, isAchieved: boolean) => {
    if (isAchieved) {
      const doItem = dos.find(d => d.id === doId)
      if (doItem) {
        setCelebrationModal({
          isOpen: true,
          doTitle: doItem.title,
          date: format(new Date(date), 'yyyy年MM月dd日', { locale: ja }),
        })
      }
    }
  }

  const closeCelebrationModal = () => {
    setCelebrationModal({
      isOpen: false,
      doTitle: '',
      date: '',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary-text">読み込み中...</div>
      </div>
    )
  }

  if (!user) {
    return <Auth onSuccess={() => window.location.reload()} />
  }

  const tabs = [
    { id: 'calendar' as const, label: 'カレンダー', icon: CalendarIcon },
    { id: 'dos' as const, label: 'Doリスト', icon: List },
    { id: 'settings' as const, label: '設定', icon: SettingsIcon },
  ]

  return (
    <div className="min-h-screen bg-background">
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
          fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-subtle-elements transform transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0 lg:z-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
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
                        w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left
                        ${activeTab === tab.id
                          ? 'bg-accent text-white'
                          : 'text-primary-text hover:bg-subtle-elements/20'
                        }
                      `}
                      style={activeTab === tab.id ? { backgroundColor: 'var(--color-accent)' } : {}}
                    >
                      <Icon size={20} />
                      {tab.label}
                    </button>
                  )
                })}
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
              <Calendar dos={dos} onAchievementToggle={handleAchievementToggle} />
            )}
            {activeTab === 'dos' && <DoManager />}
            {activeTab === 'settings' && <Settings />}
          </div>
        </div>
      </div>

      {/* Celebration Modal */}
      <CelebrationModal
        isOpen={celebrationModal.isOpen}
        onClose={closeCelebrationModal}
        doTitle={celebrationModal.doTitle}
        date={celebrationModal.date}
      />
    </div>
  )
}
