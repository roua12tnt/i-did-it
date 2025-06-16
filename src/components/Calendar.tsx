'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Star, Calendar as CalendarIcon, Sparkles } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns'
import { ja } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface Do {
  id: string
  title: string
  description: string | null
}

interface Achievement {
  id: string
  do_id: string
  achieved_date: string
}

interface CalendarProps {
  dos: Do[]
  onAchievementToggle: (doId: string, date: string, isAchieved: boolean, showConfirmation?: boolean) => void
  refreshTrigger?: number
}

export default function Calendar({ dos, onAchievementToggle, refreshTrigger }: CalendarProps) {
  const { user } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [loading, setLoading] = useState(false)

  const fetchAchievements = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .gte('achieved_date', startDate)
        .lte('achieved_date', endDate)

      if (error) {
        if (error.message?.includes('JWT') || error.message?.includes('session')) {
          console.error('Session expired while fetching achievements')
          return
        }
        throw error
      }
      setAchievements(data || [])
    } catch (error) {
      console.error('Failed to fetch achievements:', error)
    }
  }, [user?.id, currentMonth])

  useEffect(() => {
    if (user) {
      fetchAchievements()
    }
  }, [user, fetchAchievements, refreshTrigger])

  const toggleAchievement = async (doId: string, date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    const existingAchievement = achievements.find(
      a => a.do_id === doId && a.achieved_date === dateString
    )

    if (existingAchievement) {
      // 既に達成済みの場合は削除（確認なし）
      setLoading(true)
      try {
        const { error } = await supabase
          .from('achievements')
          .delete()
          .eq('id', existingAchievement.id)

        if (error) {
          if (error.message?.includes('JWT') || error.message?.includes('session')) {
            console.error('Session expired while deleting achievement')
            return
          }
          throw error
        }
        await fetchAchievements()
        onAchievementToggle(doId, dateString, false)
      } catch (error) {
        console.error('Failed to delete achievement:', error)
      } finally {
        setLoading(false)
      }
    } else {
      // 未達成の場合：30%の確率で確認モーダル、70%の確率で直接達成
      const shouldShowConfirmation = Math.random() < 0.3
      
      if (shouldShowConfirmation) {
        // 確認モーダルを表示（データ更新はしない）
        onAchievementToggle(doId, dateString, true, true)
      } else {
        // 直接達成処理を実行
        setLoading(true)
        try {
          const { error } = await supabase
            .from('achievements')
            .insert({
              user_id: user?.id,
              do_id: doId,
              achieved_date: dateString,
            })

          if (error) {
            if (error.message?.includes('JWT') || error.message?.includes('session')) {
              console.error('Session expired while adding achievement')
              return
            }
            throw error
          }
          await fetchAchievements()
          onAchievementToggle(doId, dateString, true, false)
        } catch (error) {
          console.error('Failed to add achievement:', error)
        } finally {
          setLoading(false)
        }
      }
    }
  }

  const getAchievementsForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    return achievements.filter(a => a.achieved_date === dateString)
  }

  const isAchieved = (doId: string, date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    return achievements.some(a => a.do_id === doId && a.achieved_date === dateString)
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const weekdays = ['日', '月', '火', '水', '木', '金', '土']

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentMonth(subMonths(currentMonth, 1))
    } else {
      setCurrentMonth(addMonths(currentMonth, 1))
    }
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    setSelectedDate(today)
  }

  return (
    <div className="bg-background p-6 rounded-lg border border-subtle-elements">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth('prev')}
          className="btn-icon edit p-2"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-primary-text">
            {format(currentMonth, 'yyyy年MM月', { locale: ja })}
          </h2>
          <button
            onClick={goToToday}
            className="btn-primary flex items-center gap-1 px-3 py-1 rounded-md text-sm"
          >
            <CalendarIcon size={14} />
            Today
          </button>
        </div>
        
        <button
          onClick={() => navigateMonth('next')}
          className="btn-icon edit p-2"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekdays.map(day => (
          <div key={day} className="text-center text-sm font-medium text-secondary-text p-2">
            {day}
          </div>
        ))}
        {calendarDays.map(date => {
          const dayAchievements = getAchievementsForDate(date)
          const isCurrentMonth = isSameMonth(date, currentMonth)
          const isTodayDate = isToday(date)
          const isSelected = selectedDate && isSameDay(date, selectedDate)

          return (
            <div
              key={date.toISOString()}
              className={`
                relative min-h-[80px] p-2 border cursor-pointer transition-colors
                ${!isCurrentMonth && 'bg-subtle-elements/10 text-secondary-text'}
                ${isCurrentMonth && !isTodayDate && !isSelected && 'bg-background hover:bg-subtle-elements/20'}
                ${isSelected && 'border-4'}
                ${!isTodayDate && !isSelected && 'border-subtle-elements'}
                ${isTodayDate && 'border-accent'}
              `}
              style={{
                backgroundColor: isTodayDate ? 'rgba(255, 102, 0, 0.3)' : undefined,
                borderColor: isSelected ? '#FF6600' : undefined
              }}
              onClick={() => {
                if (!isSelected) {
                  setSelectedDate(date)
                }
              }}
            >
              <div className="absolute top-1 left-1 text-xs font-medium text-secondary-text">
                {format(date, 'd')}
              </div>
              
              {dayAchievements.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-wrap gap-1 max-w-[40px] justify-center">
                    {Array.from({ length: Math.min(dayAchievements.length, 3) }, (_, index) => (
                      <div 
                        key={index}
                        className="w-4 h-4 rounded-full flex items-center justify-center shadow-lg"
                        style={{ 
                          backgroundColor: 'var(--achievement-star-bg)',
                          border: '1px solid var(--achievement-star-border)',
                          boxShadow: '0 0 6px var(--achievement-star-glow)',
                          animation: `bounce 1s infinite ${index * 0.1}s, wiggle 2s ease-in-out infinite alternate ${index * 0.2}s`
                        }}
                      >
                        <Star size={10} className="text-white" fill="currentColor" />
                      </div>
                    ))}
                    {dayAchievements.length > 3 && (
                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold bg-red-500 text-white border border-red-600">
                        +
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <style jsx>{`
                @keyframes wiggle {
                  0%, 100% { transform: rotate(-3deg) scale(1); }
                  25% { transform: rotate(5deg) scale(1.08); }
                  50% { transform: rotate(-1deg) scale(1.5); }
                  75% { transform: rotate(1deg) scale(1.05); }
                }
                @keyframes bounce {
                  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                  40% { transform: translateY(-5px); }
                  60% { transform: translateY(-1px); }
                }
              `}</style>
            </div>
          )
        })}
      </div>

      {/* Achievement Controls */}
      {selectedDate && (
        <div className="mt-6 p-4 bg-subtle-elements/10 rounded-lg">
          <h3 className="font-medium text-primary-text mb-3">
            {format(selectedDate, 'yyyy年MM月dd日', { locale: ja })} の達成記録
          </h3>
          
          {dos.length === 0 ? (
            <p className="text-secondary-text text-sm">
              まずはDoを登録してください
            </p>
          ) : (
            <div className="space-y-2">
              {dos.map(doItem => (
                <div key={doItem.id} className="flex items-center justify-between p-3 bg-background rounded-md border border-subtle-elements">
                  <div className="flex-1">
                    <div className="font-medium text-primary-text">{doItem.title}</div>
                    {doItem.description && (
                      <div className="text-sm text-secondary-text mt-1">{doItem.description}</div>
                    )}
                  </div>
                  <button
                    onClick={() => toggleAchievement(doItem.id, selectedDate)}
                    disabled={loading}
                    className={`achievement-btn flex items-center justify-center w-8 h-8 ${
                      isAchieved(doItem.id, selectedDate) ? 'achieved' : 'unachieved'
                    }`}
                  >
                    {isAchieved(doItem.id, selectedDate) && <Sparkles size={16} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}