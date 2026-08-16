import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import { isTheme } from "@/lib/theme";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="ghost"
						size="icon-sm"
						className="relative"
						aria-label="Change theme"
					/>
				}
			>
				{/* Swapped by the `dark` class, so the icon matches what is rendered. */}
				<SunIcon className="rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
				<MoonIcon className="absolute rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-auto min-w-36">
				<DropdownMenuRadioGroup
					value={theme}
					onValueChange={(value) => {
						if (isTheme(value)) setTheme(value);
					}}
				>
					<DropdownMenuRadioItem value="light" closeOnClick>
						<SunIcon />
						Light
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="dark" closeOnClick>
						<MoonIcon />
						Dark
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="system" closeOnClick>
						<MonitorIcon />
						System
					</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
