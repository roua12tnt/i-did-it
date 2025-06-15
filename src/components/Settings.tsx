'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { User, Moon, Sun, LogOut, Save, Trash2, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  email: string
  birthday: string | null
  created_at: string
  updated_at: string
  selected_message_set_id: string | null
}

interface MessageSet {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export default function Settings() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [email, setEmail] = useState('')
  const [birthday, setBirthday] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  
  // Message Set related states
  const [messageSets, setMessageSets] = useState<MessageSet[]>([])
  const [selectedMessageSetId, setSelectedMessageSetId] = useState<string>('')

  const fetchProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, birthday, created_at, updated_at, selected_message_set_id')
        .eq('id', user?.id)
        .single()

      if (error) throw error

      if (data) {
        setProfile(data)
        setEmail(data.email)
        setBirthday(data.birthday || '')
        setSelectedMessageSetId(data.selected_message_set_id || '')
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      setError('プロフィールの取得に失敗しました')
    }
  }, [user?.id])

  const fetchMessageSets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('message_sets')
        .select('*')
        .order('created_at')

      if (error) throw error
      setMessageSets(data || [])
    } catch (error) {
      console.error('Failed to fetch message sets:', error)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchMessageSets()
    }
  }, [user, fetchProfile, fetchMessageSets])

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('メールアドレスは必須です')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const birthdayValue = birthday.trim() || null

      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          email: email.trim(),
          birthday: birthdayValue
        })
        .eq('id', user?.id)
        .select('id, email, birthday, created_at, updated_at, selected_message_set_id')
        .single()

      if (error) throw error

      if (data) {
        setProfile(data)
        setEmail(data.email)
        setBirthday(data.birthday || '')
        setSelectedMessageSetId(data.selected_message_set_id || '')
      }

      setSuccess('プロフィールを更新しました')
    } catch (err) {
      console.error('Failed to update profile:', err)
      setError('プロフィールの更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const updateMessageSet = async (setId: string) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ selected_message_set_id: setId })
        .eq('id', user?.id)
        .select('id, email, birthday, created_at, updated_at, selected_message_set_id')
        .single()

      if (error) throw error

      if (data) {
        setProfile(data)
        setEmail(data.email)
        setBirthday(data.birthday || '')
        setSelectedMessageSetId(data.selected_message_set_id || '')
      }

      setSuccess('メッセージセットを変更しました')
    } catch (err) {
      console.error('Failed to update message set:', err)
      setError('メッセージセットの変更に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    if (confirm('ログアウトしますか？')) {
      await signOut()
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    setError('')

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user?.id)

      if (profileError) throw profileError

      const { error: authError } = await supabase.auth.admin.deleteUser(user?.id || '')
      
      if (authError) {
        const { error: userDeleteError } = await supabase.auth.signOut()
        if (userDeleteError) throw userDeleteError
      }

      alert('アカウントが正常に削除されました。')
    } catch (err) {
      console.error('Failed to delete account:', err)
      setError('アカウントの削除に失敗しました。サポートにお問い合わせください。')
    } finally {
      setDeleteLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="bg-background p-6 rounded-lg border border-subtle-elements">
      <h2 className="text-xl font-bold text-primary-text mb-6 flex items-center gap-2">
        <User size={20} />
        設定
      </h2>
      <p className="text-secondary-text mb-8">私は褒められたい</p>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="border-b border-subtle-elements pb-6">
          <h3 className="text-lg font-semibold text-primary-text mb-4">プロフィール</h3>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-md shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <AlertCircle size={20} className="text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-800">エラー</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-md shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <CheckCircle size={20} className="text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">成功</p>
                  <p className="text-sm text-green-700 mt-1">{success}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={updateProfile} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary-text mb-2">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-subtle-elements rounded-md bg-background text-primary-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="birthday" className="block text-sm font-medium text-primary-text mb-2">
                誕生日
              </label>
              <input
                id="birthday"
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full px-3 py-2 border border-subtle-elements rounded-md bg-background text-primary-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                lang="ja"
                data-date-format="YYYY/MM/DD"
              />
            </div>

            {profile && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                <h4 className="text-sm font-medium text-primary-text mb-2">アカウント情報</h4>
                <div className="text-sm text-secondary-text space-y-1">
                  <p>作成日: {new Date(profile.created_at).toLocaleDateString('ja-JP')}</p>
                  <p>更新日: {new Date(profile.updated_at).toLocaleDateString('ja-JP')}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (email === profile?.email && birthday === (profile?.birthday || ''))}
              className="btn-primary flex items-center gap-2 px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {loading ? '保存中...' : '保存'}
            </button>
          </form>
        </div>

        {/* Theme Section */}
        <div className="border-b border-subtle-elements pb-6">
          <h3 className="text-lg font-semibold text-primary-text mb-4">テーマ</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-text font-medium">表示テーマ</p>
              <p className="text-secondary-text text-sm">
                {theme === 'light' ? 'ライトモード' : 'ダークモード'}で表示しています
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 bg-subtle-elements text-primary-text rounded-md hover:bg-subtle-elements/70 transition-colors"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              {theme === 'light' ? 'ダークモード' : 'ライトモード'}に切り替え
            </button>
          </div>
        </div>

        {/* Message Set Section */}
        <div className="border-b border-subtle-elements pb-6">
          <h3 className="text-lg font-semibold text-primary-text mb-4 flex items-center gap-2">
            <MessageSquare size={20} />
            メッセージセット
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              {messageSets.map(set => (
                <div key={set.id} className="flex items-center justify-between p-3 border border-subtle-elements rounded-md bg-background">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="radio"
                      id={`set-${set.id}`}
                      name="messageSet"
                      value={set.id}
                      checked={selectedMessageSetId === set.id}
                      onChange={() => updateMessageSet(set.id)}
                      disabled={loading}
                      className="w-4 h-4 text-accent"
                    />
                    
                    <label htmlFor={`set-${set.id}`} className="text-primary-text font-medium cursor-pointer flex-1">
                      {set.name}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div>
          <h3 className="text-lg font-semibold text-primary-text mb-4">アカウント</h3>
          
          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-md"
            >
              <LogOut size={16} />
              ログアウト
            </button>

            <div className="border-t border-subtle-elements my-3"></div>

            <div className="flex justify-center">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-danger flex items-center gap-2 px-4 py-2 rounded-md"
              >
                <Trash2 size={16} />
                アカウントを削除
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-subtle-elements max-w-md w-full mx-4 shadow-xl" style={{ backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937' }}>
            <h3 className="text-lg font-bold text-primary-text mb-4">アカウント削除の確認</h3>
            
            <div className="mb-6">
              <p className="text-primary-text mb-3">
                本当にアカウントを削除しますか？
              </p>
              <div className="bg-red-100/95 dark:bg-red-900/20 border-l-4 border-red-400 rounded-r-md p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <AlertCircle size={24} className="text-red-600 dark:text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-900 dark:text-red-200 mb-2">重要な警告</p>
                    <ul className="text-sm text-red-800 dark:text-red-300 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 font-bold">•</span>
                        <span>この操作は<strong>絶対に取り消すことができません</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 font-bold">•</span>
                        <span>すべての<strong>Doと達成記録が削除</strong>されます</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 font-bold">•</span>
                        <span><strong>アカウント情報も完全に削除</strong>されます</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                className="btn-secondary px-4 py-2 rounded-md"
              >
                キャンセル
              </button>
              
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="btn-danger px-4 py-2 rounded-md disabled:opacity-50"
              >
                {deleteLoading ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}