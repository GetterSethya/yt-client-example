import type {
  MemberBadgeSchema,
  MessageSchema,
  PartSchema,
  ThumbnailSchema,
} from '@gettersethya/yt-livechat-client'
import { CrownIcon, WrenchIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
} from '@/components/ui/message'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useChatStyle } from '@/hooks/use-chat-style'
import { cn } from '@/lib/utils'

function largestThumbnail(thumbnails: readonly ThumbnailSchema[] | undefined) {
  if (!thumbnails || thumbnails.length === 0) return undefined
  return thumbnails.reduce((best, thumbnail) =>
    thumbnail.width > best.width ? thumbnail : best,
  )
}

function smallestThumbnail(thumbnails: readonly ThumbnailSchema[] | undefined) {
  if (!thumbnails || thumbnails.length === 0) return undefined
  return thumbnails.reduce((best, thumbnail) =>
    thumbnail.width < best.width ? thumbnail : best,
  )
}

function initials(author: string) {
  const letters = author
    .replace(/^@/, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')

  return letters.toUpperCase() || '?'
}

/**
 * The API sends timestamps as an epoch value (seconds, milliseconds, or the
 * microseconds YouTube itself uses) or as an already-formatted clock string.
 */
function formatTimestamp(timestamp: string) {
  if (!/^\d+$/.test(timestamp)) return timestamp

  const value = Number(timestamp)
  const ms =
    timestamp.length > 13
      ? value / 1000
      : timestamp.length > 10
        ? value
        : value * 1000
  const date = new Date(ms)

  if (Number.isNaN(date.getTime())) return timestamp

  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function MemberBadge({ badge }: { badge: MemberBadgeSchema }) {
  const thumbnail = smallestThumbnail(badge.thumbnails)

  if (!thumbnail) {
    return (
      <Badge variant="secondary" className="h-4 px-1 text-[10px]">
        {badge.tooltip}
      </Badge>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <img
            src={thumbnail.url}
            alt={badge.tooltip}
            className="size-4 shrink-0 rounded-sm object-contain"
          />
        }
      />
      <TooltipContent>{badge.tooltip}</TooltipContent>
    </Tooltip>
  )
}

function MessageParts({
  parts,
  message,
}: {
  parts: readonly PartSchema[]
  message: string
}) {
  if (parts.length === 0) return <>{message}</>

  return (
    <>
      {parts.map((part, index) => {
        if (part.kind === 'text') {
          // eslint-disable-next-line react/no-array-index-key -- parts have no id
          return <span key={index}>{part.text}</span>
        }

        if (part.is_custom) {
          const thumbnail = largestThumbnail(part.thumbnails)

          return thumbnail ? (
            <img
              key={index}
              src={thumbnail.url}
              alt={part.shortcut}
              title={part.shortcut}
              loading="lazy"
              className="inline-block size-6 align-text-bottom object-contain"
            />
          ) : (
            <span key={index}>{part.shortcut}</span>
          )
        }

        const unicode = part.mapped_unicode || part.emoji_id || part.shortcut

        return (
          <span key={index} title={part.shortcut}>
            {unicode}
          </span>
        )
      })}
    </>
  )
}

function AuthorAvatar({ message }: { message: MessageSchema }) {
  const photo = largestThumbnail(message.authorPhoto)

  return (
    <Avatar size="sm">
      {photo ? <AvatarImage src={photo.url} alt={message.author} /> : null}
      <AvatarFallback>{initials(message.author)}</AvatarFallback>
    </Avatar>
  )
}

/** The owner/moderator/member markers that follow the author name. */
function RoleMarkers({ message }: { message: MessageSchema }) {
  return (
    <>
      {message.isOwner ? (
        <Badge className="h-4 gap-1 px-1 text-[10px]">
          <CrownIcon />
          Owner
        </Badge>
      ) : null}

      {message.isModerator ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="text-blue-600 dark:text-blue-400">
                <WrenchIcon className="size-3.5" />
              </span>
            }
          />
          <TooltipContent>Moderator</TooltipContent>
        </Tooltip>
      ) : null}

      {message.memberBadge ? <MemberBadge badge={message.memberBadge} /> : null}
    </>
  )
}

/** Author name plus the role markers, shared by the YouTube and bubble styles. */
function AuthorMeta({ message }: { message: MessageSchema }) {
  return (
    <>
      <span
        className={cn(
          'truncate font-semibold text-foreground',
          message.isModerator && 'text-blue-600 dark:text-blue-400',
          message.isMember && 'text-emerald-600 dark:text-emerald-400',
        )}
      >
        {message.author}
      </span>

      <RoleMarkers message={message} />
    </>
  )
}

/** The dense row YouTube live chat uses: avatar, inline name, then the text. */
function YouTubeChatMessage({ message }: { message: MessageSchema }) {
  return (
    <Message className="items-start gap-2.5">
      <MessageAvatar className="min-w-6 self-start bg-transparent">
        <AuthorAvatar message={message} />
      </MessageAvatar>

      <MessageContent className="gap-0.5">
        <MessageHeader className="gap-1.5 px-0">
          <AuthorMeta message={message} />

          <span className="ms-auto shrink-0 ps-2 text-[11px] tabular-nums">
            {formatTimestamp(message.timestamp)}
          </span>
        </MessageHeader>

        <p className="text-sm leading-6 wrap-break-word">
          <MessageParts parts={message.parts} message={message.message} />
        </p>
      </MessageContent>
    </Message>
  )
}

/**
 * Bubble tint per role, so standing is readable at a glance. These target the
 * content element the same way `bubbleVariants` does, so tailwind-merge drops
 * the `muted` base underneath them.
 *
 * Moderators use blue rather than `--primary`, which is neutral in this theme,
 * and the tints match the author-name colors used by both styles.
 */
const OWNER_BUBBLE =
  '*:data-[slot=bubble-content]:border-amber-500/40 *:data-[slot=bubble-content]:bg-amber-400/25 *:data-[slot=bubble-content]:text-amber-950 dark:*:data-[slot=bubble-content]:border-amber-400/30 dark:*:data-[slot=bubble-content]:bg-amber-400/15 dark:*:data-[slot=bubble-content]:text-amber-50'

const MODERATOR_BUBBLE =
  '*:data-[slot=bubble-content]:border-blue-500/30 *:data-[slot=bubble-content]:bg-blue-500/15 *:data-[slot=bubble-content]:text-blue-950 dark:*:data-[slot=bubble-content]:border-blue-400/30 dark:*:data-[slot=bubble-content]:bg-blue-400/15 dark:*:data-[slot=bubble-content]:text-blue-50'

const MEMBER_BUBBLE =
  '*:data-[slot=bubble-content]:border-emerald-500/30 *:data-[slot=bubble-content]:bg-emerald-500/15 *:data-[slot=bubble-content]:text-emerald-950 dark:*:data-[slot=bubble-content]:border-emerald-400/30 dark:*:data-[slot=bubble-content]:bg-emerald-400/15 dark:*:data-[slot=bubble-content]:text-emerald-50'

function roleBubbleClass(message: MessageSchema) {
  if (message.isOwner) return OWNER_BUBBLE
  if (message.isModerator) return MODERATOR_BUBBLE
  if (message.isMember) return MEMBER_BUBBLE
  return undefined
}

/** The shadcn composition: Message frame with the text inside a Bubble. */
function BubbleChatMessage({ message }: { message: MessageSchema }) {
  return (
    <Message>
      <MessageAvatar className="bg-transparent">
        <AuthorAvatar message={message} />
      </MessageAvatar>

      <MessageContent className="gap-1">
        <MessageHeader className="gap-1.5">
          <AuthorMeta message={message} />

          <span className="ms-auto shrink-0 ps-2 text-[11px] font-normal tabular-nums">
            {formatTimestamp(message.timestamp)}
          </span>
        </MessageHeader>

        <Bubble variant="muted" className={roleBubbleClass(message)}>
          <BubbleContent>
            <MessageParts parts={message.parts} message={message.message} />
          </BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  )
}

/**
 * WhatsApp gives every participant in a group chat one of a fixed set of name
 * colors, picked from the author rather than their role.
 */
const WHATSAPP_NAME_COLORS = [
  'text-pink-600 dark:text-pink-400',
  'text-sky-600 dark:text-sky-400',
  'text-violet-600 dark:text-violet-400',
  'text-amber-600 dark:text-amber-400',
  'text-teal-600 dark:text-teal-400',
  'text-rose-600 dark:text-rose-400',
  'text-indigo-600 dark:text-indigo-400',
  'text-lime-600 dark:text-lime-400',
]

function whatsappNameColor(author: string) {
  let hash = 0

  for (let index = 0; index < author.length; index++) {
    hash = (hash * 31 + author.charCodeAt(index)) | 0
  }

  return WHATSAPP_NAME_COLORS[Math.abs(hash) % WHATSAPP_NAME_COLORS.length]
}

/**
 * WhatsApp's tailed bubbles. Nobody in a live chat is "you", so the broadcaster
 * takes the outgoing (green, right-hand) side and everyone else comes in on the
 * left, the way a group chat reads.
 *
 * The tail is the usual CSS trick: a zero-size pseudo-element whose top border
 * is the bubble color and whose side border is transparent, which leaves a
 * wedge against the bubble's top corner.
 */
function WhatsAppChatMessage({ message }: { message: MessageSchema }) {
  const outgoing = message.isOwner

  return (
    <div className={cn('flex w-full items-end gap-1.5', outgoing && 'justify-end')}>
      {outgoing ? null : (
        <div className="mb-0.5 shrink-0">
          <AuthorAvatar message={message} />
        </div>
      )}

      <div
        className={cn(
          'relative max-w-[85%] min-w-0 rounded-lg px-2 py-1.5 text-sm shadow-sm',
          'before:absolute before:top-0 before:size-0 before:border-t-8',
          outgoing
            ? 'rounded-se-none bg-[#d9fdd3] text-neutral-900 before:-end-2 before:border-e-8 before:border-e-transparent before:border-t-[#d9fdd3] dark:bg-[#005c4b] dark:text-neutral-50 dark:before:border-t-[#005c4b]'
            : 'rounded-ss-none bg-white text-neutral-900 before:-start-2 before:border-s-8 before:border-s-transparent before:border-t-white dark:bg-[#202c33] dark:text-neutral-50 dark:before:border-t-[#202c33]',
        )}
      >
        <div className="flex min-w-0 items-center gap-1 text-[13px] font-semibold">
          <span className={cn('truncate', whatsappNameColor(message.author))}>
            {message.author}
          </span>
          <RoleMarkers message={message} />
        </div>

        {/* Wraps so the time trails the last line when it fits, like WhatsApp. */}
        <div className="flex flex-wrap items-end justify-end gap-x-2">
          <p className="min-w-0 grow leading-5 wrap-break-word">
            <MessageParts parts={message.parts} message={message.message} />
          </p>
          <span className="shrink-0 text-[10px] tabular-nums text-black/45 dark:text-white/60">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  )
}

export function ChatMessage({ message }: { message: MessageSchema }) {
  const { chatStyle } = useChatStyle()

  if (chatStyle === 'bubble') return <BubbleChatMessage message={message} />
  if (chatStyle === 'whatsapp') return <WhatsAppChatMessage message={message} />

  return <YouTubeChatMessage message={message} />
}
