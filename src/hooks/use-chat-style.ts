import { useContext } from 'react'
import { ChatStyleContext } from '@/lib/chat-style'

export function useChatStyle() {
  const context = useContext(ChatStyleContext)

  if (!context) {
    throw new Error('useChatStyle must be used within a ChatStyleProvider.')
  }

  return context
}
