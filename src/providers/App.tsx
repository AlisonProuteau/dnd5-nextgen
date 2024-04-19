import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthPage } from '../components/AuthPage';
import { CharacterCard } from '../components/CharacterCard/CharacterCard';
import { CharacterCreation } from '../components/CharacterCreation/CharacterCreation';
import { ErrorPage } from '../components/ErrorPage';
import { Header } from '../components/Header';
import { Home } from '../components/Home';

export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Header />} errorElement={<ErrorPage />}>
          <Route path="/" element={<Home />} />
          <Route path="/character/:id" element={<CharacterCard />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/create" element={<CharacterCreation />} />
          {/* <Route path="/database" element={<DataBasePage />} /> */}
          {/* <Route path='' element={} loader={}/> */}
        </Route>
      </Routes>
    </Router>
  );
}
