import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthPage } from '../components/AuthPage';
import { ClassData } from '../components/ClassData';
import { ErrorPage } from '../components/ErrorPage';
import { Header } from '../components/Header';
import { Home } from '../components/Home';

export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Header />} errorElement={<ErrorPage />}>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/infos" element={<ClassData />} />
          {/* <Route path='' element={} loader={}/> */}
        </Route>
      </Routes>
    </Router>
  );
}
