import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ChatStyleProvider } from "./components/chat-style-provider.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import { TooltipProvider } from "./components/ui/tooltip.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<ThemeProvider>
			<ChatStyleProvider>
				<TooltipProvider>
					<App />
				</TooltipProvider>
			</ChatStyleProvider>
		</ThemeProvider>
	</StrictMode>,
);
