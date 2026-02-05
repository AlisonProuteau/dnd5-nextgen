import { Fragment } from 'react';
import {
  type ErrorResponse,
  Navigate,
  Route,
  Routes,
  useLocation,
  useRouteError
} from 'react-router-dom';
import { FullPageLoader } from '@shared/Loader';
import { CharacterContainer } from './components/CharacterCard/CharacterContainer';
import { CharacterPoints } from './components/CharacterCard/CharacterPoints';
import { CharacterCreation } from './components/CharacterCreation/CharacterCreation';
import CharacterGenerator from './components/CharacterGenerator/CharacterGenerator';
import { AuthPage } from './pages/AuthPage';
import { ContactForm } from './pages/ContactForm';
import { Header } from './pages/Header';
import { Home } from './pages/Home';
import { Settings } from './pages/Settings';
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
            {user.uid === import.meta.env.FIREBASE_ADMIN_UID && (
              <Fragment>
                <Route path="/database" element={<DataBasePage />} />
                <Route path="/character-generator" element={<CharacterGenerator />} />
              </Fragment>
            )}
            <Route path="/settings" element={<Settings />} />
            <Route path="/contact" element={<ContactForm />} />
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
    <FullPageLoader open={isLoading} />
  );
}
