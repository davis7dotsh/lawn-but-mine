const THEME_STORAGE_KEY = "lawn-theme";

type Theme = "light" | "dark";

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const attributeTheme = document.documentElement.getAttribute("data-theme");
  if (attributeTheme === "dark" || attributeTheme === "light") return attributeTheme;
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "dark" || storedTheme === "light") return storedTheme;
  return getSystemTheme();
}

class ThemeState {
  theme = $state<Theme>("light");
  mounted = $state(false);

  constructor() {
    if (typeof window !== "undefined") {
      this.theme = getInitialTheme();
      this.mounted = true;
      this.applyTheme();
      this.setupKeyboardShortcut();
    }
  }

  toggle() {
    this.theme = this.theme === "dark" ? "light" : "dark";
    this.applyTheme();
  }

  private applyTheme() {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", this.theme);
    localStorage.setItem(THEME_STORAGE_KEY, this.theme);
  }

  private setupKeyboardShortcut() {
    if (typeof window === "undefined") return;
    window.addEventListener("keydown", (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        this.toggle();
      }
    });
  }
}

export const themeState = new ThemeState();
