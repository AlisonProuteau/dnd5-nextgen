import { useEffect } from 'react';
import {
  Route,
  Routes,
  useLocation,
  useNavigate,
  useRouteError,
  type ErrorResponse
} from 'react-router-dom';
import { AuthPage } from '../components/AuthPage';
import { CharacterCard } from '../components/CharacterCard/CharacterCard';
import { CharacterPoints } from '../components/CharacterCard/CharacterPoints';
import { CharacterCreation } from '../components/CharacterCreation/CharacterCreation';
import { Home } from '../components/Home';
import { Header } from '../components/shared/Header';
import { useAuth } from './AuthProvider';

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
  const user = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!location.pathname.startsWith('/auth') && !user?.uid) navigate('/auth', { replace: true });
    if (location.pathname.startsWith('/character') && !location.state?.characterId)
      navigate('/', { replace: true });
  }, [location.pathname]);

  return (
    <Routes>
      <Route element={<Header />} errorElement={<ErrorPage />}>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="create" element={<CharacterCreation />} />
        <Route path="/character">
          <Route index element={<CharacterCard />} />
          <Route path="points" element={<CharacterPoints />} />
        </Route>
      </Route>
      {/* <Route path="/database" element={<DataBasePage />} /> */}
    </Routes>
  );
}
