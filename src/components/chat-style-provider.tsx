import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import {
  ChatStyleContext,
  CHAT_STYLE_STORAGE_KEY,
  CHAT_STYLES,
  DEFAULT_CHAT_STYLE,
  isChatStyle,
  readStoredChatStyle,
  storeChatStyle,
  type ChatStyle,
} from '@/lib/chat-style'

export function ChatStyleProvider({
  children,
  defaultChatStyle = DEFAULT_CHAT_STYLE,
}: {
  children: ReactNode
  defaultChatStyle?: ChatStyle
}) {
  const [chatStyle, setChatStyleState] = useState<ChatStyle>(
    () => readStoredChatStyle() ?? defaultChatStyle
  )

  // Keep other tabs of the app in sync.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== CHAT_STYLE_STORAGE_KEY) return
      setChatStyleState(isChatStyle(event.newValue) ? event.newValue : defaultChatStyle)
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [defaultChatStyle])

  const setChatStyle = useCallback((next: ChatStyle) => {
    setChatStyleState(next)
    storeChatStyle(next)
  }, [])

  const toggleChatStyle = useCallback(() => {
    setChatStyleState((current) => {
      const next = CHAT_STYLES[(CHAT_STYLES.indexOf(current) + 1) % CHAT_STYLES.length]
      storeChatStyle(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ chatStyle, setChatStyle, toggleChatStyle }),
    [chatStyle, setChatStyle, toggleChatStyle]
  )

  return <ChatStyleContext value={value}>{children}</ChatStyleContext>
}
