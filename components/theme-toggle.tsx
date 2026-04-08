"use client"

import * as React from "react"
import { Palette, Moon } from "lucide-react"

import { Button } from "@/components/ui/button"

const THEME_COOKIE_KEY = "xuthi_theme"
const DEFAULT_THEME = "amber"

function isValidTheme(theme: string | null): theme is "amber" | "monochrome" {
    return theme === "amber" || theme === "monochrome"
}

export function ThemeToggle() {
    const [mounted, setMounted] = React.useState(false)
    const [theme, setTheme] = React.useState<"amber" | "monochrome">(
        DEFAULT_THEME,
    )

    React.useEffect(() => {
        setMounted(true)

        const htmlTheme = document.documentElement.getAttribute("data-theme")
        if (isValidTheme(htmlTheme)) {
            setTheme(htmlTheme)
            return
        }

        document.documentElement.setAttribute("data-theme", DEFAULT_THEME)
    }, [])

    const persistTheme = (nextTheme: "amber" | "monochrome") => {
        setTheme(nextTheme)
        document.documentElement.setAttribute("data-theme", nextTheme)
        document.cookie = `${THEME_COOKIE_KEY}=${nextTheme}; Path=/; Max-Age=31536000; SameSite=Lax`
        try {
            window.localStorage.setItem("theme", nextTheme)
        } catch {
            // Ignore storage errors (privacy mode, blocked storage, etc.)
        }
    }

    const toggleTheme = () => {
        const nextTheme = theme === "amber" ? "monochrome" : "amber"
        persistTheme(nextTheme)
    }

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="w-9 h-9">
                <span className="sr-only">Toggle theme</span>
            </Button>
        )
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-9 h-9 hover:bg-nav-hover"
            aria-label="Toggle theme"
        >
            {theme === "amber" ? (
                <Palette className="h-[1.2rem] w-[1.2rem] text-primary" />
            ) : (
                <Moon className="h-[1.2rem] w-[1.2rem]" />
            )}
        </Button>
    )
}
