'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    let isMounted = true
    let loadingTimeout: NodeJS.Timeout | null = null

    const handleSessionExpired = () => {
      if (!isMounted) return
      setUser(null)
      setSessionExpired(true)
      setLoading(false)
    }

    // 10秒後に強制的にローディングを終了
    const forceEndLoading = () => {
      loadingTimeout = setTimeout(() => {
        if (isMounted) {
          console.warn('Forcing loading to end after timeout')
          setLoading(false)
        }
      }, 10000)
    }

    forceEndLoading()

    const createProfile = async (user: User) => {
      if (!isMounted) return
      
      try {
        // 既存のプロフィールを確認
        const { error: selectError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        // セッションエラーをチェック
        if (selectError && selectError.code === 'PGRST116') {
          // デフォルトメッセージセットを取得
          const { data: defaultMessageSet } = await supabase
            .from('message_sets')
            .select('id')
            .eq('name', 'デフォルト')
            .single()

          // プロフィールが存在しない場合のみ作成
          const { error } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email!,
              selected_message_set_id: defaultMessageSet?.id || null,
            })
          
          if (error) {
            console.error('Error creating profile:', error)
            if (error.message?.includes('JWT') || error.message?.includes('session')) {
              handleSessionExpired()
              throw new Error('Session expired during profile creation')
            }
            // 他のエラーの場合は続行
          }
        } else if (selectError) {
          console.error('Error checking profile:', selectError)
          if (selectError.message?.includes('JWT') || selectError.message?.includes('session')) {
            handleSessionExpired()
            throw new Error('Session expired during profile check')
          }
          // 他のエラーの場合は続行
        }
      } catch (error) {
        console.error('Error creating profile:', error)
      }
    }

    // Get initial session
    const getInitialSession = async () => {
      if (!isMounted) return
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!isMounted) return
        
        if (error) {
          console.error('Session error:', error)
          handleSessionExpired()
          return
        }

        if (session?.user) {
          setUser(session.user)
          setSessionExpired(false)
          try {
            await createProfile(session.user)
          } catch (profileError) {
            console.error('Profile creation failed:', profileError)
            // プロフィール作成でエラーが発生してもセッションは有効と判断
          }
        } else {
          setUser(null)
        }
        
        // セッション確認完了後は必ずローディングを終了
        if (isMounted) {
          setLoading(false)
          if (loadingTimeout) {
            clearTimeout(loadingTimeout)
            loadingTimeout = null
          }
        }
      } catch (error) {
        console.error('Error getting session:', error)
        if (isMounted) {
          handleSessionExpired()
        }
      } finally {
        // 必ずローディング状態を終了
        if (isMounted) {
          setLoading(false)
          if (loadingTimeout) {
            clearTimeout(loadingTimeout)
            loadingTimeout = null
          }
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        
        try {
          if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
            if (!session) {
              handleSessionExpired()
              return
            }
          }

          if (session?.user) {
            setUser(session.user)
            setSessionExpired(false)
            try {
              await createProfile(session.user)
            } catch (profileError) {
              console.error('Profile creation failed in auth state change:', profileError)
              // プロフィール作成でエラーが発生してもセッションは有効と判断
            }
          } else {
            setUser(null)
            if (event !== 'INITIAL_SESSION') {
              handleSessionExpired()
            }
          }
          
          // 認証状態変更の処理完了後はローディングを終了
          if (isMounted) {
            setLoading(false)
            if (loadingTimeout) {
              clearTimeout(loadingTimeout)
              loadingTimeout = null
            }
          }
        } catch (error) {
          console.error('Auth state change error:', error)
          if (isMounted) {
            handleSessionExpired()
          }
        } finally {
          // 必ずローディング状態を終了
          if (isMounted) {
            setLoading(false)
            if (loadingTimeout) {
              clearTimeout(loadingTimeout)
              loadingTimeout = null
            }
          }
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
      if (loadingTimeout) {
        clearTimeout(loadingTimeout)
      }
    }
  }, []) // 空の依存配列で一度だけ実行

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Supabase signOut error:', error)
      }
      // 常にローカル状態をクリア
      setUser(null)
      setSessionExpired(false)
      setLoading(false)
    } catch (error) {
      console.error('Error signing out:', error)
      // 強制的にローカル状態をクリア
      setUser(null)
      setSessionExpired(false)
      setLoading(false)
    }
  }

  const clearSessionExpired = () => {
    setSessionExpired(false)
  }

  return {
    user,
    loading,
    sessionExpired,
    signOut,
    clearSessionExpired,
  }
}