import { useEffect, useState } from 'react';

export const THEME_STORAGE_KEY = 'theme';

export function getInitialTheme() {
    if (typeof window === 'undefined') {
        return 'light';
    }

    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
    }

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme) {
    if (typeof document === 'undefined') {
        return;
    }

    document.documentElement.dataset.theme = theme;
}

export function useStoredTheme() {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        applyTheme(theme);
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
    };

    return { theme, setTheme, toggleTheme };
}
