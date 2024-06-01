import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster, toast } from 'react-hot-toast';
import { BrowserRouter as Router } from 'react-router-dom';
import { App } from './providers/App';
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
    onSuccess: (data, { queryKey }) => console.debug(queryKey, data)
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
        <Toaster />
        <CssBaseline />
        <Router>
          <AuthProvider>
            <App />
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);

// reportWebVitals(console.info);
