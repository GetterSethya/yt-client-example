import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { ChatStyleProvider } from "./components/chat-style-provider.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import { TooltipProvider } from "./components/ui/tooltip.tsx";
import { router } from "./router.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<ThemeProvider>
			<ChatStyleProvider>
				<TooltipProvider>
					<RouterProvider router={router} />
				</TooltipProvider>
			</ChatStyleProvider>
		</ThemeProvider>
	</StrictMode>,
);
