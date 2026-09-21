import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { toast, Toaster } from 'react-hot-toast';
import { BrowserRouter as Router } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { AuthProvider } from './providers/AuthProvider';

const { FIRESTORE_EMULATOR_HOST, FIREBASE_AUTH_EMULATOR_HOST, FIREBASE_STORAGE_EMULATOR_HOST } =
  import.meta.env;
const CY_MODE =
  FIRESTORE_EMULATOR_HOST || FIREBASE_AUTH_EMULATOR_HOST || FIREBASE_STORAGE_EMULATOR_HOST;

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(
        `Something went wrong
        ${(error as Error).message || 'Error'}`
      );
    },
    onSuccess: (data, { queryKey }) => {
      console.debug(queryKey.join(', '), data);
    }
  }),
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      retry: false,
      refetchOnWindowFocus: false,
      select: (data) => data ?? undefined
    }
  }
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark'
  }
});
root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={darkTheme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Toaster
            toastOptions={{
              duration: CY_MODE ? 500 : undefined,
              style: {
                borderRadius: '8px',
                backgroundColor: '#272727',
                border: '1px solid #3E3E3E'
              },
              success: {
                style: {
                  border: '1px solid #10B981',
                  color: '#E6F4EA'
                },
                iconTheme: {
                  primary: '#34D399',
                  secondary: '#272727'
                }
              },
              error: {
                style: {
                  border: '1px solid #EF4444',
                  color: '#FCE8E6'
                },
                iconTheme: {
                  primary: '#F87171',
                  secondary: '#272727'
                }
              }
            }}
          />
          <CssBaseline />
          <Router>
            <AuthProvider>
              <App />
            </AuthProvider>
          </Router>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
