'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { User, Moon, Sun, LogOut, Save, Trash2, MessageSquare, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
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
  const [initialLoading, setInitialLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  
  // Message Set related states
  const [messageSets, setMessageSets] = useState<MessageSet[]>([])
  const [selectedMessageSetId, setSelectedMessageSetId] = useState<string>('')
  
  // Password change related states
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  // const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  // const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return
    
    setError('')
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, birthday, created_at, updated_at, selected_message_set_id')
        .eq('id', user.id)
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
      setProfile(null)
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
      setMessageSets([])
    }
  }, [])

  useEffect(() => {
    if (user?.id) {
      Promise.all([
        fetchProfile(),
        fetchMessageSets()
      ]).catch(error => {
        console.error('Failed to load initial data:', error)
      }).finally(() => {
        setInitialLoading(false)
      })
    } else {
      setProfile(null)
      setEmail('')
      setBirthday('')
      setSelectedMessageSetId('')
      setMessageSets([])
      setError('')
      setSuccess('')
      setInitialLoading(false)
    }
  }, [user?.id, fetchProfile, fetchMessageSets])

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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordError('')
    setPasswordSuccess('')

    // バリデーション
    if (!newPassword.trim()) {
      setPasswordError('新しいパスワードを入力してください')
      setPasswordLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('新しいパスワードは6文字以上で入力してください')
      setPasswordLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('パスワードが一致しません')
      setPasswordLoading(false)
      return
    }

    try {
      // セッションの確認
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        setPasswordError('セッションが無効です。ページを更新してもう一度お試しください。')
        setPasswordLoading(false)
        return
      }
      
      // タイムアウト付きでパスワード更新
      const updatePromise = supabase.auth.updateUser({
        password: newPassword
      })
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      })
      
      const { error: updateError } = await Promise.race([updatePromise, timeoutPromise]) as { error?: Error }

      if (updateError) {
        throw updateError
      }

      setPasswordSuccess('パスワードが正常に変更されました')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordForm(false)
      
      // 5秒後に成功メッセージを消す
      setTimeout(() => {
        setPasswordSuccess('')
      }, 5000)

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      if (errorMessage === 'Request timeout') {
        setPasswordError('リクエストがタイムアウトしました。ネットワーク接続を確認してもう一度お試しください。')
      } else if (errorMessage.includes('Password should be at least')) {
        setPasswordError('新しいパスワードは6文字以上で入力してください')
      } else if (errorMessage.includes('New password should be different from the old password') || 
                 errorMessage.includes('same as the old password')) {
        setPasswordError('新しいパスワードは現在のパスワードと異なるものを設定してください')
      } else if (errorMessage.includes('Password is too weak')) {
        setPasswordError('パスワードが弱すぎます。より強力なパスワードを設定してください')
      } else if (errorMessage.includes('session') || errorMessage.includes('JWT')) {
        setPasswordError('セッションが切れました。ページを更新してもう一度お試しください。')
      } else {
        setPasswordError('パスワードの変更に失敗しました。しばらく時間をおいて再度お試しください。')
      }
    } finally {
      setPasswordLoading(false)
    }
  }

  const resetPasswordForm = () => {
    // setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
    setPasswordSuccess('')
    // setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
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

  if (initialLoading) {
    return (
      <div className="bg-background p-6 rounded-lg border border-subtle-elements">
        <div className="flex items-center justify-center py-12">
          <div className="text-secondary-text">読み込み中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background p-6 rounded-lg border border-subtle-elements">
      <h2 className="text-xl font-bold text-primary-text mb-6 flex items-center gap-2">
        <User size={20} />
        設定
      </h2>
      <p className="text-secondary-text mb-8">私は褒められたい</p>

      <div className="space-y-6">
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
                      disabled={loading || initialLoading}
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
              <div className="bg-subtle-elements p-3 rounded-md">
                <h4 className="text-sm font-medium text-primary-text mb-2">アカウント情報</h4>
                <div className="text-sm text-secondary-text space-y-1">
                  <p>作成日: {new Date(profile.created_at).toLocaleDateString('ja-JP')}</p>
                  <p>更新日: {new Date(profile.updated_at).toLocaleDateString('ja-JP')}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || initialLoading || (email === profile?.email && birthday === (profile?.birthday || ''))}
              className="btn-primary flex items-center gap-2 px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {loading ? '保存中...' : '保存'}
            </button>
          </form>
        </div>

        {/* Password Section */}
        <div className="border-b border-subtle-elements pb-6">
          <h3 className="text-lg font-semibold text-primary-text mb-4 flex items-center gap-2">
            パスワード
          </h3>
          
          {passwordSuccess && (
            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-md shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <CheckCircle size={20} className="text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">成功</p>
                  <p className="text-sm text-green-700 mt-1">{passwordSuccess}</p>
                </div>
              </div>
            </div>
          )}

          {!showPasswordForm ? (
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setShowPasswordForm(true)
                  resetPasswordForm()
                  setPasswordError('')
                  setPasswordSuccess('')
                }}
                className="btn-primary px-4 py-2 rounded-md"
              >
                パスワードを変更
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {passwordError && (
                <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r-md shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <AlertCircle size={20} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-800">エラー</p>
                      <p className="text-sm text-red-700 mt-1">{passwordError}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handlePasswordChange} className="space-y-4">

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-primary-text mb-2">
                    新しいパスワード
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-subtle-elements rounded-md bg-background text-primary-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="新しいパスワードを入力（6文字以上）"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-text hover:text-primary-text"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary-text mb-2">
                    新しいパスワード（確認）
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-subtle-elements rounded-md bg-background text-primary-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="新しいパスワードを再度入力"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-text hover:text-primary-text"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false)
                      resetPasswordForm()
                      setPasswordError('')
                      setPasswordSuccess('')
                    }}
                    disabled={passwordLoading}
                    className="btn-secondary px-4 py-2 rounded-md"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading || !newPassword || !confirmPassword}
                    className="btn-primary flex items-center gap-2 px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={16} />
                    {passwordLoading ? '変更中...' : 'パスワードを変更'}
                  </button>
                </div>
              </form>
            </div>
          )}
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