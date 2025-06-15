'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AuthProps {
  onSuccess: () => void
}

export default function Auth({ onSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
      }
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8 bg-background border border-subtle-elements rounded-lg shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center text-primary-text mb-2">
            I did it!
          </h2>
          <p className="text-center text-secondary-text">
            {isLogin ? 'ログインしてください' : 'アカウントを作成してください'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-primary-text mb-2">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-subtle-elements rounded-md bg-background text-primary-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-primary-text mb-2">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-subtle-elements rounded-md bg-background text-primary-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-error text-sm bg-error/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '処理中...' : (isLogin ? 'ログイン' : 'アカウント作成')}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="btn-link text-sm"
          >
            {isLogin ? 'アカウントをお持ちでない方はこちら' : 'すでにアカウントをお持ちの方はこちら'}
          </button>
        </div>
      </div>
    </div>
  )
}