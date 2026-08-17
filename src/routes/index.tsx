import { extractVideoId } from "@gettersethya/yt-livechat-client";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function IndexPage() {
	const navigate = useNavigate();
	const [url, setUrl] = useState("");
	const [error, setError] = useState<string | null>(null);

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const videoId = extractVideoId(url.trim());
		if (!videoId) {
			setError("Invalid YouTube URL. Paste a livestream or video link.");
			return;
		}
		navigate({ to: "/$videoId", params: { videoId } });
	}

	return (
		<div className="flex h-svh items-center justify-center bg-background text-foreground">
			<form
				onSubmit={handleSubmit}
				className="flex w-full max-w-lg flex-col gap-2 px-4"
			>
				<label htmlFor="video-url" className="text-sm font-medium">
					YouTube livestream URL
				</label>
				<div className="flex gap-2">
					<Input
						id="video-url"
						type="url"
						autoFocus
						placeholder="https://www.youtube.com/live/E7Qf9GbUaqk"
						value={url}
						onChange={(event) => {
							setUrl(event.target.value);
							setError(null);
						}}
						aria-invalid={error ? true : undefined}
						className="h-9"
					/>
					<Button type="submit" className="h-9">
						Submit
					</Button>
				</div>
				{error ? (
					<p role="alert" className="text-xs text-destructive">
						{error}
					</p>
				) : null}
			</form>
		</div>
	);
}
