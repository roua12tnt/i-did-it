'use client'

import React, { useEffect, useState } from 'react'
import { X, Sparkles, Star, Trophy } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { MEMO_MAX_LENGTH } from '@/types'

interface CelebrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveMemo: (memo: string) => void
  doTitle: string
  date: string
}

export default function CelebrationModal({ isOpen, onClose, onSaveMemo, doTitle, date }: CelebrationModalProps) {
  const [praiseMessage, setPraiseMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [memo, setMemo] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchRandomPraiseMessage()
      setMemo('')
    }
  }, [isOpen])

  const fetchRandomPraiseMessage = async () => {
    setLoading(true)
    try {
      // Get user's selected message set
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('selected_message_set_id')
        .eq('id', userData.user?.id)
        .single()

      if (profileError) throw profileError

      // Get messages from user's selected set, fallback to default set if none selected
      let setId = profileData.selected_message_set_id
      if (!setId) {
        const { data: defaultSet, error: defaultError } = await supabase
          .from('message_sets')
          .select('id')
          .eq('name', 'デフォルト')
          .single()
        
        if (defaultError) throw defaultError
        setId = defaultSet.id
      }

      const { data, error } = await supabase
        .from('praise_messages')
        .select('message')
        .eq('set_id', setId)

      if (error) throw error

      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length)
        setPraiseMessage(data[randomIndex].message)
      } else {
        setPraiseMessage('素晴らしい！今日もやり遂げましたね！')
      }
    } catch (error) {
      console.error('Failed to fetch praise message:', error)
      setPraiseMessage('素晴らしい！今日もやり遂げましたね！')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const shareText = `「${doTitle}」を${date}に達成しました！\n${praiseMessage}\n\n#Ididit #習慣化 #1日3DO`
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6 relative overflow-hidden" style={{ 
        backgroundColor: 'var(--color-background)',
        animation: 'celebrationPulse 2s ease-in-out infinite alternate, modalSlide 0.5s ease-out'
      }}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-secondary-text hover:text-primary-text transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="text-center relative z-10">
          {/* Celebration Icon */}
          <div className="mb-4 flex justify-center relative">
            <div className="w-20 h-20 rounded-full flex items-center justify-center relative" style={{ 
              backgroundColor: 'var(--achievement-star-bg)',
              animation: 'bounce 1s infinite'
            }}>
              <Sparkles size={40} className="text-white" style={{ animation: 'spin 3s linear infinite' }} />
              
              {/* Orbiting sparkles */}
              <div className="absolute inset-0" style={{ animation: 'spin 4s linear infinite' }}>
                <Sparkles size={16} className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-yellow-400" />
                <Sparkles size={14} className="absolute top-1/2 -right-2 transform -translate-y-1/2 text-yellow-300" />
                <Sparkles size={18} className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-yellow-500" />
                <Sparkles size={12} className="absolute top-1/2 -left-2 transform -translate-y-1/2 text-yellow-200" />
              </div>
            </div>
          </div>

          {/* Celebration Title */}
          <h2 className="text-3xl font-bold mb-2" style={{ 
            color: '#FF6600',
            animation: 'titleBounce 0.8s ease-out'
          }}>
            You DID it!
          </h2>

          {/* Achievement Info */}
          <div className="mb-4">
            <p className="text-primary-text font-bold mb-1 text-xl" style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>
              「{doTitle}」
            </p>
            <p className="text-secondary-text" style={{ animation: 'fadeInUp 0.6s ease-out 0.4s both' }}>
              {date} に達成しました！
            </p>
          </div>

          {/* Praise Message */}
          <div className="mb-6 p-4 rounded-lg border relative" style={{ 
            backgroundColor: 'white', 
            borderColor: 'rgba(76, 175, 80, 0.3)',
            animation: 'fadeInUp 0.6s ease-out 0.6s both'
          }}>
            {loading ? (
              <div className="text-secondary-text">メッセージを読み込み中...</div>
            ) : (
              <p className="font-medium text-lg" style={{ color: '#333333' }}>
                {praiseMessage}
              </p>
            )}
          </div>

          {/* Memo Input */}
          <div className="mb-6" style={{ animation: 'fadeInUp 0.6s ease-out 0.7s both' }}>
            <label htmlFor="achievement-memo" className="block text-sm font-medium text-primary-text mb-2 text-left">
              今日の達成メモ
            </label>
            <textarea
              id="achievement-memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full px-3 py-2 border border-subtle-elements rounded-md bg-background text-primary-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
              placeholder="なんか一言残す（任意）"
              rows={3}
              maxLength={MEMO_MAX_LENGTH}
            />
            <div className="text-xs text-secondary-text mt-1 text-right">
              {memo.length}/{MEMO_MAX_LENGTH}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => {
              console.log('Close button clicked, memo:', memo)
              if (memo.trim()) {
                console.log('Calling onSaveMemo with:', memo.trim())
                onSaveMemo(memo.trim())
              }
              onClose()
            }}
            className="w-full px-6 py-3 text-white rounded-md transition-all font-bold text-lg relative overflow-hidden mb-6"
            style={{ 
              backgroundColor: '#FF6600',
              animation: 'fadeInUp 0.6s ease-out 0.8s both'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 102, 0, 0.7)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FF6600'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            どうも！（保存して閉じる）
          </button>

          {/* Share Button */}
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all mx-auto"
            style={{ 
              backgroundColor: '#000000',
              animation: 'fadeInUp 0.6s ease-out 0.9s both'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#000000'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
        </div>

        {/* Enhanced Confetti Animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {/* Sparkles */}
          {[...Array(15)].map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `sparkleFloat ${3 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            >
              <Sparkles size={8 + Math.random() * 8} className="text-yellow-400" />
            </div>
          ))}
          
          {/* Stars */}
          {[...Array(10)].map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `starTwinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            >
              <Star size={6 + Math.random() * 10} className="text-yellow-400" fill="currentColor" />
            </div>
          ))}


          {/* Trophy confetti */}
          {[...Array(5)].map((_, i) => (
            <div
              key={`trophy-${i}`}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `trophyBounce ${3 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            >
              <Trophy size={10 + Math.random() * 8} className="text-yellow-500" />
            </div>
          ))}
        </div>

        {/* CSS Animations */}
        <style jsx>{`
          @keyframes celebrationPulse {
            0% { box-shadow: 0 0 20px rgba(76, 175, 80, 0.3); }
            100% { box-shadow: 0 0 40px rgba(76, 175, 80, 0.6), 0 0 60px rgba(76, 175, 80, 0.3); }
          }
          
          @keyframes modalSlide {
            0% { transform: translateY(-50px) scale(0.8); opacity: 0; }
            100% { transform: translateY(0) scale(1); opacity: 1; }
          }
          
          @keyframes titleBounce {
            0% { transform: scale(0) rotate(-180deg); }
            50% { transform: scale(1.2) rotate(-10deg); }
            100% { transform: scale(1) rotate(0deg); }
          }
          
          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          
          
          @keyframes sparkleFloat {
            0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 1; }
            25% { transform: translateY(-10px) rotate(90deg); opacity: 0.7; }
            50% { transform: translateY(-5px) rotate(180deg); opacity: 1; }
            75% { transform: translateY(-15px) rotate(270deg); opacity: 0.8; }
          }
          
          @keyframes starTwinkle {
            0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.8; }
            50% { transform: scale(1.5) rotate(180deg); opacity: 1; }
          }
          
          
          @keyframes trophyBounce {
            0%, 100% { transform: translateY(0px) rotate(-5deg); }
            50% { transform: translateY(-15px) rotate(5deg); }
          }
        `}</style>
      </div>
    </div>
  )
}