'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)

      // Create profile if user exists but profile doesn't
      if (session?.user) {
        await createProfile(session.user)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)

        // Create profile when user session exists
        if (session?.user) {
          await createProfile(session.user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const createProfile = async (user: User) => {
    try {
      // 既存のプロフィールを確認
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      // プロフィールが存在しない場合のみ作成
      if (!existingProfile) {
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email!,
          })
        
        if (error) {
          console.error('Error creating profile:', error)
        }
      }
    } catch (error) {
      console.error('Error creating profile:', error)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return {
    user,
    loading,
    signOut,
  }
}