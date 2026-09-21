import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
});

const STORAGE_KEY = 'theme-preference';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved === 'dark';
    // Si el usuario nunca eligió manualmente, respetamos el modo del sistema
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const isFirstRun = useRef(true);

  useEffect(() => {
    const root = document.documentElement;

    // En el montaje inicial no hay nada de qué "transicionar" - el tema
    // correcto se aplica directo, sin animar desde un estado default que
    // el usuario nunca llegó a ver.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      root.classList.toggle('ion-palette-dark', isDark);
      localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
      return;
    }

    // Sin esto, cambiar de paleta es un corte instantáneo en toda la
    // pantalla - la clase habilita una transition de color pareja
    // (ver .theme-transitioning en global.css) solo durante el cambio,
    // para no afectar el resto de las transiciones de la app.
    root.classList.add('theme-transitioning');
    root.classList.toggle('ion-palette-dark', isDark);
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');

    const timeout = window.setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
