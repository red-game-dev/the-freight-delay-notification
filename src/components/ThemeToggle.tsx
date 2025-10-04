"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Skeleton } from "./ui/Skeleton";
import { Toggle } from "./ui/Toggle";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Skeleton
        variant="rectangular"
        width={44}
        height={24}
        className="rounded-full"
      />
    );
  }

  return (
    <Toggle
      checked={theme === "dark"}
      onChange={(checked) => setTheme(checked ? "dark" : "light")}
      checkedIcon={<Moon className="w-full h-full" />}
      uncheckedIcon={<Sun className="w-full h-full" />}
      ariaLabel="Toggle theme"
      size="md"
    />
  );
}
