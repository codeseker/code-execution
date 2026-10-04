import { Check, Moon, Monitor, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/theme"

export function ThemeToggle() {
  const { mode, setMode } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon" aria-label={`Theme: ${mode}`}>
            {mode === "dark" ? <Moon className="size-4 shrink-0" /> : mode === "light" ? <Sun className="size-4 shrink-0" /> : <Monitor className="size-4 shrink-0" />}
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setMode("light")}>
          <Sun className="size-4 shrink-0" />
          Light
          {mode === "light" && <Check className="ml-auto size-4 shrink-0" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode("dark")}>
          <Moon className="size-4 shrink-0" />
          Dark
          {mode === "dark" && <Check className="ml-auto size-4 shrink-0" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode("system")}>
          <Monitor className="size-4 shrink-0" />
          System
          {mode === "system" && <Check className="ml-auto size-4 shrink-0" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}