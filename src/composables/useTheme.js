import { ref } from 'vue';

const savedTheme = (typeof window !== 'undefined' && localStorage.getItem('cortex_theme')) || 'light';
const theme = ref(savedTheme);

const applyTheme = (currentTheme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (currentTheme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('cortex_theme', currentTheme);
  }
};

// Executa imediatamente na inicialização
applyTheme(theme.value);

export function useTheme() {
  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark';
    applyTheme(theme.value);
  };

  const setTheme = (newTheme) => {
    theme.value = newTheme;
    applyTheme(newTheme);
  };

  return {
    theme,
    toggleTheme,
    setTheme
  };
}

