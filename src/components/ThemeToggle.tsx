import { Monitor, Moon, Sun } from "lucide-react";

import { useTheme, type Theme } from "@/lib/ThemeContext";

const CYCLE: Theme[] = ["light", "dark", "system"];
const ICONS: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };
const LABELS: Record<Theme, string> = { light: "Light theme", dark: "Dark theme", system: "System theme" };

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const Icon = ICONS[theme];

  const cycle = () => {
    const next = CYCLE[(CYCLE.indexOf(theme) + 1) % CYCLE.length];

    setTheme(next);
  };

  return (
    <button
      aria-label={`${LABELS[theme]} — click to change`}
      className="flex size-11 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-secondary"
      title={LABELS[theme]}
      type="button"
      onClick={cycle}
    >
      <Icon className="size-[18px]" />
    </button>
  );
}
