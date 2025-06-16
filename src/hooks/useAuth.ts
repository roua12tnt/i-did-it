'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)

  const handleSessionExpired = () => {
    setUser(null)
    setSessionExpired(true)
    setLoading(false)
  }

  const createProfile = async (user: User) => {
    try {
      // 既存のプロフィールを確認
      const { error: selectError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      // セッションエラーをチェック
      if (selectError && selectError.code === 'PGRST116') {
        // プロフィールが存在しない場合のみ作成
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email!,
          })
        
        if (error) {
          console.error('Error creating profile:', error)
          if (error.message?.includes('JWT') || error.message?.includes('session')) {
            handleSessionExpired()
          }
        }
      } else if (selectError) {
        console.error('Error checking profile:', selectError)
        if (selectError.message?.includes('JWT') || selectError.message?.includes('session')) {
          handleSessionExpired()
        }
      }
    } catch (error) {
      console.error('Error creating profile:', error)
    }
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          handleSessionExpired()
          return
        }

        if (session?.user) {
          setUser(session.user)
          setSessionExpired(false)
          await createProfile(session.user)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error getting session:', error)
        handleSessionExpired()
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
            await createProfile(session.user)
          } else {
            setUser(null)
            if (event !== 'INITIAL_SESSION') {
              handleSessionExpired()
            }
          }
        } catch (error) {
          console.error('Auth state change error:', error)
          handleSessionExpired()
        } finally {
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [createProfile])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSessionExpired(false)
    } catch (error) {
      console.error('Error signing out:', error)
      // 強制的にローカル状態をクリア
      setUser(null)
      setSessionExpired(true)
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