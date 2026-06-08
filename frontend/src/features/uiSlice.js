import { createSlice } from '@reduxjs/toolkit';

const getInitialThemeMode = () => {
  const storedTheme = localStorage.getItem('themeMode');
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }
  // Default to dark mode for premium feel
  return 'dark';
};

const initialState = {
  themeMode: getInitialThemeMode(),
  sidebarOpen: true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleThemeMode: (state) => {
      state.themeMode = state.themeMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', state.themeMode);
      
      // Update the root document class for Tailwind CSS
      if (state.themeMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    setThemeMode: (state, action) => {
      state.themeMode = action.payload;
      localStorage.setItem('themeMode', state.themeMode);
      if (state.themeMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
  },
});

export const { toggleThemeMode, setThemeMode, toggleSidebar, setSidebarOpen } = uiSlice.actions;

export default uiSlice.reducer;
