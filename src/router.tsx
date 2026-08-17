import { Outlet, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { IndexPage } from "@/routes/index";
import { VideoPage } from "@/routes/video";

const rootRoute = createRootRoute({
	component: () => <Outlet />,
});

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: IndexPage,
});

const videoRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/$videoId",
	component: VideoPage,
});

const routeTree = rootRoute.addChildren([indexRoute, videoRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
