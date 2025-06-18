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
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')

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
        setSuccessMessage('アカウントを作成しました。メールアドレス認証のためメールをご確認ください。確認後、ログイン画面からログインしてください')
        return
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
            I DID it!
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
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 pr-10 border border-subtle-elements rounded-md bg-background text-primary-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 z-10"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-error text-sm bg-error/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">
              {successMessage}
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

        {!successMessage && (
          <div className="text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="btn-link text-sm"
            >
              {isLogin ? 'アカウントをお持ちでない方はこちら' : 'すでにアカウントをお持ちの方はこちら'}
            </button>
          </div>
        )}

        {successMessage && (
          <div className="text-center">
            <button
              onClick={() => {
                setIsLogin(true)
                setSuccessMessage('')
                setEmail('')
                setPassword('')
              }}
              className="btn-primary"
            >
              ログイン画面に戻る
            </button>
          </div>
        )}
      </div>
    </div>
  )
}