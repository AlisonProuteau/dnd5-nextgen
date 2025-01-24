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
import { VersionSelection } from './components/VersionSelection';
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

// TODO: read profile/character version for fetching
// FIX: Fix the build errors from version missing on all queries with versionning
export function App() {
  const { user, isLoading, version: currentUserVersion } = useAuth();
  const location = useLocation();

  return !isLoading ? (
    <Routes>
      <Route element={<Header />} errorElement={<ErrorPage />}>
        <Route
          path="/"
          element={
            !user?.uid ? (
              <AuthPage />
            ) : currentUserVersion ? (
              <Home />
            ) : (
              <Navigate to="/version" replace />
            )
          }
        />
        {user?.uid && (
          <Fragment>
            {user.uid === '8lFf6wEj9ARVlilMOrOxYDZOkSS2' && (
              <Route path="/database" element={<DataBasePage />} />
            )}

            <Route path="/version" element={<VersionSelection />} />
            {currentUserVersion && (
              <Fragment>
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
          </Fragment>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  ) : (
    <CircularProgress size={24} />
  );
}
