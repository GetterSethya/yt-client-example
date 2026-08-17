import {
	LiveChatApiClient,
	type MessageSchema,
} from "@gettersethya/yt-livechat-client";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "@/components/chat-message";
import { ChatStyleToggle } from "@/components/chat-style-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { useChatStyle } from "@/hooks/use-chat-style";
import type { ChatStyle } from "@/lib/chat-style";
import { cn } from "@/lib/utils";

/** Injected at build time from VITE_API_BASE_URL; see .env.example. */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
	throw new Error("VITE_API_BASE_URL is not set. Copy .env.example to .env.");
}

const client = new LiveChatApiClient({
	baseUrl: API_BASE_URL,
	videoUrl: "https://www.youtube.com/live/E7Qf9GbUaqk",
});

/** Keep the transcript bounded so a long stream does not grow without limit. */
const MAX_MESSAGES = 5000;

/** How many ids to remember for the total's dedupe before pruning the oldest. */
const DEDUPE_WINDOW = 10000;

/** Starting row height guess per style; measured heights replace it on render. */
const ESTIMATED_ROW_HEIGHT: Record<ChatStyle, number> = {
	youtube: 56,
	bubble: 96,
	whatsapp: 76,
};

/** Virtualized rows are absolutely positioned, so row spacing lives in padding. */
const ROW_SPACING: Record<ChatStyle, string> = {
	youtube: "pb-3",
	bubble: "pb-4",
	whatsapp: "pb-2",
};

/** WhatsApp's wallpaper stands in for the doodle background. */
const VIEWPORT_BACKGROUND: Record<ChatStyle, string> = {
	youtube: "",
	bubble: "",
	whatsapp: "bg-[#efeae2] dark:bg-[#0b141a]",
};

type Status = "connecting" | "live" | "ended" | "error";

const statusLabel: Record<Status, string> = {
	connecting: "Connecting",
	live: "Live",
	ended: "Ended",
	error: "Error",
};

function App() {
	const { chatStyle } = useChatStyle();
	const [messages, setMessages] = useState<MessageSchema[]>([]);
	const [status, setStatus] = useState<Status>("connecting");
	const [detail, setDetail] = useState<string | null>(null);
	/** Every message seen this session, including ones trimmed off the top. */
	const [totalMessages, setTotalMessages] = useState(0);
	const viewportRef = useRef<HTMLDivElement>(null);
	/**
	 * Ids already counted. StrictMode registers the listeners twice and the API
	 * can resend a message across polls, so the total has to dedupe outside of
	 * the transcript, which drops old messages.
	 */
	const seenIdsRef = useRef<Set<string>>(new Set());

	const virtualizer = useVirtualizer({
		count: messages.length,
		getScrollElement: () => viewportRef.current,
		estimateSize: () => ESTIMATED_ROW_HEIGHT[chatStyle],
		// Keyed by message id so a measured row keeps its height when the
		// transcript is trimmed and every index shifts.
		getItemKey: (index) => messages[index]?.id ?? index,
		overscan: 8,
		// The scroller drives its follow-the-live-edge scrolls from a layout
		// effect, so the virtualizer's default flushSync lands mid-render and
		// React warns. Batched rerenders keep up fine at this row count.
		useFlushSync: false,
	});

	// Rows change height between the two styles, so drop the cached measurements.
	// The virtualizer instance is stable across renders, so chatStyle is the only
	// thing that can re-run this; it is the trigger, not something the body reads.
	// biome-ignore lint/correctness/useExhaustiveDependencies: chatStyle is the trigger
	useEffect(() => {
		virtualizer.measure();
	}, [chatStyle, virtualizer]);

	useEffect(() => {
		client.on("connected", () => setStatus("live"));
		client.on("message", (message) => {
			const seen = seenIdsRef.current;

			if (seen.has(message.id)) return;

			// Sets keep insertion order, so the newest half is the tail. Pruning
			// keeps the dedupe window well past what the API can resend.
			if (seen.size >= DEDUPE_WINDOW) {
				seenIdsRef.current = new Set(
					Array.from(seen).slice(seen.size - DEDUPE_WINDOW / 2),
				);
			}

			seenIdsRef.current.add(message.id);
			setTotalMessages((total) => total + 1);
			setMessages((prev) => {
				const next = [...prev, message];
				return next.length > MAX_MESSAGES
					? next.slice(next.length - MAX_MESSAGES)
					: next;
			});
		});
		client.on("error", (error) => {
			setStatus("error");
			setDetail(`${error.code}: ${error.message}`);
		});
		client.on("end", (reason) => {
			setStatus("ended");
			setDetail(reason);
		});
		let cancelled = false;

		client
			.connect()
			.then((c) => (cancelled ? undefined : c.start()))
			.catch((error: unknown) => {
				// stop() interrupts an in-flight start(), which rejects. That is the
				// StrictMode remount (and unmount), not a connection failure.
				if (cancelled) return;
				setStatus("error");
				setDetail(error instanceof Error ? error.message : String(error));
			});

		return () => {
			cancelled = true;
			client.stop();
		};
	}, []);

	return (
		<div className="flex h-svh flex-col bg-background text-foreground">
			<header className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
				<span
					className={cn(
						"size-2 shrink-0 rounded-full",
						status === "live" && "animate-pulse bg-red-500",
						status === "connecting" && "animate-pulse bg-amber-500",
						status === "ended" && "bg-muted-foreground",
						status === "error" && "bg-destructive",
					)}
				/>
				<h1 className="text-sm font-semibold">Live chat</h1>
				<span className="truncate text-xs text-muted-foreground">
					{statusLabel[status]}
					{detail ? ` — ${detail}` : ""}
				</span>
				<span className="ms-auto shrink-0 text-xs tabular-nums text-muted-foreground">
					{totalMessages.toLocaleString()} messages
				</span>
				<ChatStyleToggle />
				<ThemeToggle />
			</header>

			<MessageScrollerProvider autoScroll defaultScrollPosition="end">
				<MessageScroller className="flex-1">
					{/*
					 * The scroller follows the live edge with scrollTo({ behavior: "auto" }),
					 * which defers to the element's CSS scroll-behavior — so `scroll-smooth`
					 * is what turns the follow (and the jump-to-latest button) into an
					 * animated scroll instead of a jump.
					 */}
					<MessageScrollerViewport
						ref={viewportRef}
						className={cn(
							"scroll-smooth px-4 py-3 motion-reduce:scroll-auto",
							VIEWPORT_BACKGROUND[chatStyle],
						)}
					>
						{/*
						 * The virtualizer owns the rows, so this drops MessageScrollerItem
						 * and the flex gap: rows are absolutely positioned, and the spacing
						 * lives in their padding so measureElement counts it.
						 */}
						<MessageScrollerContent
							className="block min-h-full"
							aria-label="Live chat messages"
						>
							<div
								className="relative w-full"
								style={{ height: virtualizer.getTotalSize() }}
							>
								{virtualizer.getVirtualItems().map((virtualItem) => {
									const message = messages[virtualItem.index];

									if (!message) return null;

									return (
										<div
											key={virtualItem.key}
											ref={virtualizer.measureElement}
											data-index={virtualItem.index}
											className={cn(
												"absolute start-0 top-0 w-full",
												ROW_SPACING[chatStyle],
											)}
											style={{
												transform: `translateY(${virtualItem.start}px)`,
											}}
										>
											<ChatMessage message={message} />
										</div>
									);
								})}
							</div>
						</MessageScrollerContent>
					</MessageScrollerViewport>
					<MessageScrollerButton />
				</MessageScroller>
			</MessageScrollerProvider>
		</div>
	);
}

export default App;
