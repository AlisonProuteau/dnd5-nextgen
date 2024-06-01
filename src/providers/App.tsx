import { Route, Routes, useRouteError, type ErrorResponse } from 'react-router-dom';
import { AuthPage } from '../components/AuthPage';
import { CharacterCard } from '../components/CharacterCard/CharacterCard';
import { CharacterPoints } from '../components/CharacterCard/CharacterPoints';
import { CharacterCreation } from '../components/CharacterCreation/CharacterCreation';
import { Home } from '../components/Home';
import { Header } from '../components/shared/Header';

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
  return (
    <Routes>
      <Route element={<Header />} errorElement={<ErrorPage />}>
        <Route path="/character/:id">
          <Route path="points" element={<CharacterPoints />} />
          <Route index element={<CharacterCard />} />
        </Route>
        <Route path="/create" element={<CharacterCreation />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<Home />} />
        {/* <Route path="/database" element={<DataBasePage />} /> */}
        {/* <Route path='' element={} loader={}/> */}
      </Route>
    </Routes>
  );
}
