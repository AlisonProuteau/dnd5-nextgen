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
          <Toaster />
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
