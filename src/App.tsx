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
import CharacterGenerator from './components/CharacterGenerator/CharacterGenerator';
import { ContactForm } from './components/ContactForm';
import { Header } from './components/Header';
import { Home } from './components/Home';
import { Settings } from './components/Settings';
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

export function App() {
  const { user, isLoading, version } = useAuth();
  const location = useLocation();

  return !isLoading ? (
    <Routes>
      <Route element={<Header />} errorElement={<ErrorPage />}>
        <Route
          path="/"
          element={
            !user?.uid ? <AuthPage /> : version ? <Home /> : <Navigate to="/settings" replace />
          }
        />
        {user?.uid && (
          <Fragment>
            {user.uid === '8lFf6wEj9ARVlilMOrOxYDZOkSS2' && (
              <Route path="/database" element={<DataBasePage />} />
            )}
            <Route path="/settings" element={<Settings />} />
            <Route path="/contact" element={<ContactForm />} />
            <Route path="/character-generator" element={<CharacterGenerator />} />
            {version && (
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
