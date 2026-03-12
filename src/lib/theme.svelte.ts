import { browser } from "$app/environment";

export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "lawn-theme";

export const marketingThemeStyle = [
  "--background: #f0f0e8",
  "--background-alt: #1a1a1a",
  "--surface: #ffffff",
  "--surface-alt: #e8e8e0",
  "--surface-strong: #1a1a1a",
  "--surface-muted: #d8d8d0",
  "--foreground: #1a1a1a",
  "--foreground-muted: #888888",
  "--foreground-subtle: #aaaaaa",
  "--foreground-inverse: #f0f0e8",
  "--border: #1a1a1a",
  "--border-subtle: #cccccc",
  "--accent: #2d5a2d",
  "--accent-hover: #3a6a3a",
  "--accent-light: #7cb87c",
  "--shadow-color: #1a1a1a",
  "--shadow-accent: rgba(45,90,45,1)",
].join("; ");

export const themeInitScript = `
(() => {
  try {
    const stored = localStorage.getItem("${THEME_STORAGE_KEY}");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
      return;
    }
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  } catch {}
})();
`;

export const themeState = $state({
  theme: "light" as Theme,
  mounted: false,
});

let initialized = false;

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialTheme(): Theme {
  const attributeTheme = document.documentElement.getAttribute("data-theme");
  if (attributeTheme === "dark" || attributeTheme === "light") {
    return attributeTheme;
  }

  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  return getSystemTheme();
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function initTheme() {
  if (!browser || initialized) return;

  themeState.theme = getInitialTheme();
  themeState.mounted = true;
  applyTheme(themeState.theme);

  const handleKeyDown = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "l") {
      event.preventDefault();
      toggleTheme();
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  initialized = true;
}

export function setTheme(theme: Theme) {
  themeState.theme = theme;

  if (!browser || !themeState.mounted) return;
  applyTheme(theme);
}

export function toggleTheme() {
  setTheme(themeState.theme === "dark" ? "light" : "dark");
}
