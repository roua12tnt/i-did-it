// エラーハンドリングユーティリティ

// Supabaseエラーオブジェクトの型定義
interface SupabaseError {
  message?: string
  code?: string
  details?: string
  hint?: string
}

// 一般的なエラーの型（Error または SupabaseError）
type AppError = Error | SupabaseError | unknown

export const isSessionError = (error: AppError): boolean => {
  const err = error as SupabaseError
  return err?.message?.includes('JWT') || 
         err?.message?.includes('session') ||
         err?.code === 'PGRST301' // Supabase session expiry
}

export const handleSupabaseError = (
  error: AppError, 
  operation: string,
  onSessionExpired?: () => void
): { isSessionError: boolean; userMessage: string } => {
  console.error(`Failed to ${operation}:`, error)
  
  if (isSessionError(error)) {
    const message = 'セッションが切れました。ページを更新してください。'
    onSessionExpired?.()
    return {
      isSessionError: true,
      userMessage: message
    }
  }

  const err = error as SupabaseError

  // データベースエラーのハンドリング
  if (err?.code === '23505') {
    return {
      isSessionError: false,
      userMessage: '重複したデータです。'
    }
  }

  if (err?.code === '23503') {
    return {
      isSessionError: false,
      userMessage: '関連するデータが見つかりません。'
    }
  }

  // 一般的なエラー
  return {
    isSessionError: false,
    userMessage: `${operation}に失敗しました。`
  }
}

export const createErrorHandler = (
  operation: string,
  onSessionExpired?: () => void
) => {
  return (error: AppError) => handleSupabaseError(error, operation, onSessionExpired)
}

// 汎用的なSupabase操作ラッパー
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  onSessionExpired?: () => void
): Promise<{ data?: T; error?: string; isSessionError?: boolean }> => {
  try {
    const data = await operation()
    return { data }
  } catch (error) {
    const result = handleSupabaseError(error, operationName, onSessionExpired)
    return { 
      error: result.userMessage,
      isSessionError: result.isSessionError
    }
  }
}