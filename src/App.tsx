import { useEffect } from 'react';
import {
  Route,
  Routes,
  useLocation,
  useNavigate,
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
  const [user, isLoading] = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!location.pathname.startsWith('/auth') && !user?.uid) navigate('/auth', { replace: true });
    else if (location.pathname.startsWith('/auth') && user?.uid) navigate('/', { replace: true });
    else if (location.pathname.startsWith('/character') && !location.state?.characterId)
      navigate('/', { replace: true });
  }, [location.pathname, isLoading]);

  return (
    <Routes>
      <Route element={<Header />} errorElement={<ErrorPage />}>
        {/* <Route path="/database" element={<DataBasePage />} /> */}
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="create" element={<CharacterCreation />} />
        <Route path="/character">
          <Route index element={<CharacterContainer />} />
          <Route path="points" element={<CharacterPoints />} />
        </Route>
      </Route>
    </Routes>
  );
}
