import { createContext } from 'react'

/**
 * How a message row is rendered:
 * - `youtube` — the dense, single-line-ish row YouTube live chat uses.
 * - `bubble` — the shadcn Message + Bubble composition.
 * - `whatsapp` — WhatsApp's tailed bubbles on a wallpaper background.
 */
export type ChatStyle = 'youtube' | 'bubble' | 'whatsapp'

/** Every style, in the order the toggle cycles through them. */
export const CHAT_STYLES: readonly ChatStyle[] = ['youtube', 'bubble', 'whatsapp']

export const chatStyleLabel: Record<ChatStyle, string> = {
  youtube: 'YouTube',
  bubble: 'Bubbles',
  whatsapp: 'WhatsApp',
}

/** Key in localStorage. */
export const CHAT_STYLE_STORAGE_KEY = 'chat-style'

/** Used when nothing is stored yet. */
export const DEFAULT_CHAT_STYLE: ChatStyle = 'youtube'

export function isChatStyle(value: unknown): value is ChatStyle {
  return CHAT_STYLES.includes(value as ChatStyle)
}

export function readStoredChatStyle(): ChatStyle | null {
  try {
    const stored = localStorage.getItem(CHAT_STYLE_STORAGE_KEY)
    return isChatStyle(stored) ? stored : null
  } catch {
    // Storage can be unavailable (private mode, blocked cookies).
    return null
  }
}

export function storeChatStyle(style: ChatStyle) {
  try {
    localStorage.setItem(CHAT_STYLE_STORAGE_KEY, style)
  } catch {
    // Ignore: the choice still applies for this session.
  }
}

export type ChatStyleContextValue = {
  chatStyle: ChatStyle
  setChatStyle: (style: ChatStyle) => void
  toggleChatStyle: () => void
}

export const ChatStyleContext = createContext<ChatStyleContextValue | null>(null)
