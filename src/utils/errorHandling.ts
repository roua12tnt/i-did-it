// エラーハンドリングユーティリティ

export const isSessionError = (error: any): boolean => {
  return error?.message?.includes('JWT') || 
         error?.message?.includes('session') ||
         error?.code === 'PGRST301' // Supabase session expiry
}

export const handleSupabaseError = (
  error: any, 
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

  // データベースエラーのハンドリング
  if (error?.code === '23505') {
    return {
      isSessionError: false,
      userMessage: '重複したデータです。'
    }
  }

  if (error?.code === '23503') {
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
  return (error: any) => handleSupabaseError(error, operation, onSessionExpired)
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