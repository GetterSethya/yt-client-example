import { ListIcon, MessageCircleIcon, MessagesSquareIcon } from 'lucide-react'
import type { ComponentType } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useChatStyle } from '@/hooks/use-chat-style'
import { CHAT_STYLES, chatStyleLabel, isChatStyle, type ChatStyle } from '@/lib/chat-style'

const chatStyleIcon: Record<ChatStyle, ComponentType<{ className?: string }>> = {
  youtube: ListIcon,
  bubble: MessagesSquareIcon,
  whatsapp: MessageCircleIcon,
}

export function ChatStyleToggle() {
  const { chatStyle, setChatStyle } = useChatStyle()
  const CurrentIcon = chatStyleIcon[chatStyle]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label="Change chat style" />}
      >
        <CurrentIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-36">
        <DropdownMenuRadioGroup
          value={chatStyle}
          onValueChange={(value) => {
            if (isChatStyle(value)) setChatStyle(value)
          }}
        >
          {CHAT_STYLES.map((style) => {
            const Icon = chatStyleIcon[style]

            return (
              <DropdownMenuRadioItem key={style} value={style} closeOnClick>
                <Icon />
                {chatStyleLabel[style]}
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
