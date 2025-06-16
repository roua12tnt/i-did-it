'use client'

import React from 'react'
import { X } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  doTitle: string
  date: string
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  doTitle,
  date,
}: ConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div 
        className="bg-background rounded-lg p-6 max-w-md w-full border border-subtle-elements relative"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-secondary-text hover:text-primary-text transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center">
          <h2 className="text-xl font-bold text-primary-text mb-4">
            ほんとに？
          </h2>
          
          <div className="mb-6">
            <p className="text-primary-text mb-2">
              <span className="font-medium">「{doTitle}」</span>
            </p>
            <p className="text-secondary-text text-sm">
              {date} に達成しましたか？
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={onConfirm}
              className="btn-primary px-6 py-2 rounded-md font-medium"
            >
              本当！
            </button>
            <button
              onClick={onClose}
              className="btn-secondary px-6 py-2 rounded-md font-medium"
            >
              あとで
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}