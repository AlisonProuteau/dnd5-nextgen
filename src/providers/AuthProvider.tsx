import { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { onAuthChange } from '../firebase';

const AuthContext = createContext<[User | null, boolean]>([null, true]);
export function AuthProvider({ children }: { children: JSX.Element }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    onAuthChange((currentUser) => {
      setIsLoading(false);
      setUser(currentUser);
      if (!currentUser) navigate('/auth');
    });
  }, []);

  return <AuthContext.Provider value={[user, isLoading]}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
