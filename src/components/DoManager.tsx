'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface Do {
  id: string
  title: string
  description: string | null
}

export default function DoManager() {
  const { user } = useAuth()
  const [dos, setDos] = useState<Do[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newDo, setNewDo] = useState({ title: '', description: '' })
  const [editDo, setEditDo] = useState({ title: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchDos = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const { data, error } = await supabase
        .from('dos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) {
        if (error.message?.includes('JWT') || error.message?.includes('session')) {
          console.error('Session expired while fetching dos')
          setError('セッションが切れました。ページを更新してください。')
          return
        }
        throw error
      }
      setDos(data || [])
    } catch (err) {
      console.error('Failed to fetch dos:', err)
      setError('Doの取得に失敗しました')
    }
  }, [user?.id])

  useEffect(() => {
    if (user) {
      fetchDos()
    }
  }, [user, fetchDos])

  const addDo = async () => {
    if (!newDo.title.trim()) return
    if (dos.length >= 3) {
      setError('Doは3つまでしか登録できません')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('dos')
        .insert({
          user_id: user?.id,
          title: newDo.title.trim(),
          description: newDo.description.trim() || null,
        })

      if (error) {
        if (error.message?.includes('JWT') || error.message?.includes('session')) {
          setError('セッションが切れました。ページを更新してください。')
          return
        }
        throw error
      }

      setNewDo({ title: '', description: '' })
      setIsAdding(false)
      await fetchDos()
    } catch (err) {
      console.error('Failed to add do:', err)
      setError('Doの追加に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const updateDo = async (id: string) => {
    if (!editDo.title.trim()) return

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('dos')
        .update({
          title: editDo.title.trim(),
          description: editDo.description.trim() || null,
        })
        .eq('id', id)

      if (error) {
        if (error.message?.includes('JWT') || error.message?.includes('session')) {
          setError('セッションが切れました。ページを更新してください。')
          return
        }
        throw error
      }

      setEditingId(null)
      await fetchDos()
    } catch (err) {
      console.error('Failed to update do:', err)
      setError('Doの更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const deleteDo = async (id: string) => {
    if (!confirm('このDoを削除しますか？関連する達成記録も削除されます。')) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('dos')
        .delete()
        .eq('id', id)

      if (error) {
        if (error.message?.includes('JWT') || error.message?.includes('session')) {
          setError('セッションが切れました。ページを更新してください。')
          return
        }
        throw error
      }
      await fetchDos()
    } catch (err) {
      console.error('Failed to delete do:', err)
      setError('Doの削除に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (doItem: Do) => {
    setEditingId(doItem.id)
    setEditDo({
      title: doItem.title,
      description: doItem.description || '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDo({ title: '', description: '' })
  }

  const cancelAdd = () => {
    setIsAdding(false)
    setNewDo({ title: '', description: '' })
  }

  return (
    <div className="bg-background p-6 rounded-lg border border-subtle-elements">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-primary-text">マイDo ({dos.length}/3)</h2>
        {!isAdding && dos.length < 3 && (
          <button
            onClick={() => setIsAdding(true)}
            className="btn-primary flex items-center gap-2 px-4 py-2 rounded-md"
          >
            <Plus size={16} />
            新しいDoを追加
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-md text-error text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {dos.map(doItem => (
          <div key={doItem.id} className="p-4 border border-subtle-elements rounded-md bg-background">
            {editingId === doItem.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editDo.title}
                  onChange={(e) => setEditDo({ ...editDo, title: e.target.value })}
                  className="w-full px-3 py-2 border border-subtle-elements rounded-md bg-background text-primary-text focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Doのタイトル"
                />
                <textarea
                  value={editDo.description}
                  onChange={(e) => setEditDo({ ...editDo, description: e.target.value })}
                  className="w-full px-3 py-2 border border-subtle-elements rounded-md bg-background text-primary-text focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  placeholder="説明 (オプション)"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => updateDo(doItem.id)}
                    disabled={loading || !editDo.title.trim()}
                    className="btn-primary flex items-center gap-2 px-3 py-1.5 rounded-md disabled:opacity-50 text-sm"
                  >
                    <Save size={14} />
                    保存
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="btn-secondary flex items-center gap-2 px-3 py-1.5 rounded-md text-sm"
                  >
                    <X size={14} />
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-primary-text">{doItem.title}</h3>
                  {doItem.description && (
                    <p className="text-secondary-text text-sm mt-1">{doItem.description}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => startEdit(doItem)}
                    className="btn-icon edit p-1.5"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteDo(doItem.id)}
                    className="btn-icon delete p-1.5"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {isAdding && (
          <div className="p-4 border border-subtle-elements rounded-md bg-background">
            <div className="space-y-3">
              <input
                type="text"
                value={newDo.title}
                onChange={(e) => setNewDo({ ...newDo, title: e.target.value })}
                className="w-full px-3 py-2 border border-subtle-elements rounded-md bg-background text-primary-text focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Doのタイトル"
              />
              <textarea
                value={newDo.description}
                onChange={(e) => setNewDo({ ...newDo, description: e.target.value })}
                className="w-full px-3 py-2 border border-subtle-elements rounded-md bg-background text-primary-text focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                placeholder="説明 (オプション)"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={addDo}
                  disabled={loading || !newDo.title.trim()}
                  className="btn-primary flex items-center gap-2 px-3 py-1.5 rounded-md disabled:opacity-50 text-sm"
                >
                  <Save size={14} />
                  追加
                </button>
                <button
                  onClick={cancelAdd}
                  className="btn-secondary flex items-center gap-2 px-3 py-1.5 rounded-md text-sm"
                >
                  <X size={14} />
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}

        {dos.length === 0 && !isAdding && (
          <div className="text-center py-8 text-secondary-text">
            <p>まだDoが登録されていません</p>
            <p className="text-sm mt-1">「新しいDoを追加」ボタンから始めましょう</p>
          </div>
        )}
      </div>
    </div>
  )
}