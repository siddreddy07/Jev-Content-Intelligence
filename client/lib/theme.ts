export const STORAGE_KEY = "jev-theme"

/**
 * Inline script rendered by the server layout. It sets the theme class on
 * <html> before first paint, so there is no flash. Mirrors getSnapshot() in
 * components/theme-provider.tsx.
 */
export const themeInitScript = `try{var t=localStorage.getItem("${STORAGE_KEY}");if(t!=="light"&&t!=="dark")t="dark";document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}`
