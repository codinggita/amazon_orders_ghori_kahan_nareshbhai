import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

export const AppThemeProvider = ({ children }) => {
  const { themeMode } = useSelector((state) => state.ui);

  // Sync Tailwind class on mount & changes
  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  const muiTheme = useMemo(() => {
    return createTheme({
      palette: {
        mode: themeMode,
        primary: {
          main: '#f59e0b', // Amber/Amazon Gold
          contrastText: '#0f172a',
        },
        secondary: {
          main: '#f97316', // Orange
        },
        background: {
          default: themeMode === 'dark' ? '#020617' : '#f8fafc',
          paper: themeMode === 'dark' ? '#0f172a' : '#ffffff',
        },
        text: {
          primary: themeMode === 'dark' ? '#f1f5f9' : '#0f172a',
          secondary: themeMode === 'dark' ? '#94a3b8' : '#475569',
        },
        divider: themeMode === 'dark' ? '#1e293b' : '#e2e8f0',
      },
      typography: {
        fontFamily: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ].join(','),
      },
      shape: {
        borderRadius: 16, // Premium rounded corners matching dashboard
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 12,
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
            },
          },
        },
      },
    });
  }, [themeMode]);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default AppThemeProvider;
