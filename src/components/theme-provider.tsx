import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
	applyTheme,
	DEFAULT_THEME,
	getSystemTheme,
	isTheme,
	readStoredTheme,
	type ResolvedTheme,
	storeTheme,
	type Theme,
	THEME_STORAGE_KEY,
	ThemeContext,
} from "@/lib/theme";

export function ThemeProvider({
	children,
	defaultTheme = DEFAULT_THEME,
}: {
	children: ReactNode;
	defaultTheme?: Theme;
}) {
	const [theme, setThemeState] = useState<Theme>(
		() => readStoredTheme() ?? defaultTheme,
	);
	const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

	// Follow the OS while the choice is "system", including live changes.
	useEffect(() => {
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => setSystemTheme(media.matches ? "dark" : "light");

		onChange();
		media.addEventListener("change", onChange);
		return () => media.removeEventListener("change", onChange);
	}, []);

	// Keep other tabs of the app in sync.
	useEffect(() => {
		const onStorage = (event: StorageEvent) => {
			if (event.key !== THEME_STORAGE_KEY) return;
			setThemeState(isTheme(event.newValue) ? event.newValue : defaultTheme);
		};

		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, [defaultTheme]);

	const resolvedTheme = theme === "system" ? systemTheme : theme;

	// The inline script in index.html applies the same class before first paint,
	// so this only has to handle changes after mount.
	useEffect(() => {
		applyTheme(resolvedTheme);
	}, [resolvedTheme]);

	const setTheme = useCallback((next: Theme) => {
		setThemeState(next);
		storeTheme(next);
	}, []);

	const value = useMemo(
		() => ({ theme, resolvedTheme, setTheme }),
		[theme, resolvedTheme, setTheme],
	);

	return <ThemeContext value={value}>{children}</ThemeContext>;
}
