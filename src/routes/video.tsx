import { useParams } from "@tanstack/react-router";
import App from "@/App";

export function VideoPage() {
	const { videoId } = useParams({ from: "/$videoId" });

	return <App key={videoId} videoId={videoId} />;
}
