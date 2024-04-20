import { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthChange } from '../firebase';

const AuthContext = createContext<User | null>(null);
export function AuthProvider({ children }: { children: JSX.Element }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    onAuthChange((currentUser) => {
      setUser(currentUser);
      if (currentUser) navigate('/');
      else navigate('/auth');
    });
  }, []);

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
