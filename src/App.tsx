import { CircularProgress } from '@mui/material';
import { Fragment } from 'react';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useRouteError,
  type ErrorResponse
} from 'react-router-dom';
import { AuthPage } from './components/AuthPage';
import { CharacterContainer } from './components/CharacterCard/CharacterContainer';
import { CharacterPoints } from './components/CharacterCard/CharacterPoints';
import { CharacterCreation } from './components/CharacterCreation/CharacterCreation';
import { Header } from './components/Header';
import { Home } from './components/Home';
import { useAuth } from './providers/AuthProvider';
import { DataBasePage } from './providers/DataBasePage';

function ErrorPage() {
  const error = useRouteError() as (Error & ErrorResponse) | undefined;
  console.error(error);

  return (
    <div>
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{error?.statusText || error?.message}</i>
      </p>
    </div>
  );
}

// TODO: on load if not set, ask for Legacy or 2024 (set default boolean)
// TODO: on select, set the default if selected
// TODO: on load if set, go to the correct version
// TODO: add  button to change version
// TODO: make 2024 version disabled
// TODO: make characters dependant on version (version field?)
export function App() {
  const [user, isLoading] = useAuth();
  const location = useLocation();

  return !isLoading ? (
    <Routes>
      <Route element={<Header />} errorElement={<ErrorPage />}>
        <Route path="/" element={!user?.uid ? <AuthPage /> : <Home />} />
        {user?.uid && (
          <Fragment>
            {user.uid === '8lFf6wEj9ARVlilMOrOxYDZOkSS2' && (
              <Route path="/database" element={<DataBasePage />} />
            )}
            <Route path="create" element={<CharacterCreation />} />
            <Route
              path="/character/*"
              element={
                !location.state?.characterId ? (
                  <Navigate to="/" replace />
                ) : (
                  <Routes>
                    <Route index element={<CharacterContainer />} />
                    <Route path="points" element={<CharacterPoints />} />
                  </Routes>
                )
              }
            />
          </Fragment>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  ) : (
    <CircularProgress size={24} />
  );
}
