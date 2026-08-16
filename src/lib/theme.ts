import { createContext } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/** Key in localStorage. Kept in sync with the no-flash script in index.html. */
export const THEME_STORAGE_KEY = "theme";

/** Used when nothing is stored yet. Kept in sync with index.html. */
export const DEFAULT_THEME: Theme = "dark";

export function isTheme(value: unknown): value is Theme {
	return value === "light" || value === "dark" || value === "system";
}

export function readStoredTheme(): Theme | null {
	try {
		const stored = localStorage.getItem(THEME_STORAGE_KEY);
		return isTheme(stored) ? stored : null;
	} catch {
		// Storage can be unavailable (private mode, blocked cookies).
		return null;
	}
}

export function storeTheme(theme: Theme) {
	try {
		localStorage.setItem(THEME_STORAGE_KEY, theme);
	} catch {
		// Ignore: the theme still applies for this session.
	}
}

export function getSystemTheme(): ResolvedTheme {
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

/**
 * Tailwind's dark variant is `&:is(.dark *)`, so the class goes on <html>.
 * `color-scheme` keeps native UI (scrollbars, form controls) in step.
 */
export function applyTheme(resolved: ResolvedTheme) {
	const root = document.documentElement;
	root.classList.toggle("dark", resolved === "dark");
	root.style.colorScheme = resolved;
}

export type ThemeContextValue = {
	/** What the user picked, which may be "system". */
	theme: Theme;
	/** What is actually rendered right now. */
	resolvedTheme: ResolvedTheme;
	setTheme: (theme: Theme) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
