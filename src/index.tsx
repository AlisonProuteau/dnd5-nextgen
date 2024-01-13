import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster, toast } from 'react-hot-toast';
import { QueryCache, QueryClient, QueryClientProvider } from 'react-query';
import { ErrorResponse, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ErrorPage } from './components/ErrorPage';
import { Home } from './components/Home';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      console.log('in client');
      toast.error(
        `Something went wrong
        ${(error as ErrorResponse).statusText || (error as Error).message || 'Error'}`
      );
    }
  }),
  defaultOptions: { queries: { staleTime: Infinity, retry: false, refetchOnWindowFocus: false } }
});
const router = createBrowserRouter([
  {
    path: '/',
    // action: todosAction,
    // loader: homeLoader,
    element: <Home />,
    errorElement: <ErrorPage />
    // children: [{ path: '/database', element: <DataBasePage /> }]
  }
]);

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <RouterProvider router={router} fallbackElement={<div>Fallback...</div>} />
    </QueryClientProvider>
  </StrictMode>
);

// reportWebVitals(console.log);
