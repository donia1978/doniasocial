import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "relative h-9 w-16 rounded-full border border-border/50 bg-muted/30 p-1 transition-all duration-300 hover:bg-muted/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
      aria-label="Toggle theme"
    >
      {/* Background track */}
      <span
        className={cn(
          "absolute inset-0 rounded-full transition-colors duration-500",
          isDark 
            ? "bg-gradient-to-r from-slate-800 to-slate-900" 
            : "bg-gradient-to-r from-amber-100 to-orange-200"
        )}
      />
      
      {/* Sliding circle with icon */}
      <span
        className={cn(
          "relative z-10 flex h-7 w-7 items-center justify-center rounded-full shadow-lg transition-all duration-300 ease-spring",
          isDark 
            ? "translate-x-[calc(100%-2px)] bg-slate-700" 
            : "translate-x-0 bg-white"
        )}
      >
        <Sun
          className={cn(
            "absolute h-4 w-4 transition-all duration-300",
            isDark 
              ? "rotate-90 scale-0 text-yellow-500" 
              : "rotate-0 scale-100 text-amber-500"
          )}
        />
        <Moon
          className={cn(
            "absolute h-4 w-4 transition-all duration-300",
            isDark 
              ? "rotate-0 scale-100 text-blue-300" 
              : "-rotate-90 scale-0 text-slate-700"
          )}
        />
      </span>
      
      {/* Stars animation for dark mode */}
      <span
        className={cn(
          "absolute right-2 top-1 h-1 w-1 rounded-full bg-white transition-all duration-500",
          isDark ? "opacity-100 animate-pulse" : "opacity-0"
        )}
      />
      <span
        className={cn(
          "absolute right-4 top-2.5 h-0.5 w-0.5 rounded-full bg-white transition-all duration-700 delay-100",
          isDark ? "opacity-100 animate-pulse" : "opacity-0"
        )}
      />
    </Button>
  );
}
