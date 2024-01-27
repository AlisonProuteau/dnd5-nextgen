import { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange } from '../firebase';

const AuthContext = createContext<User | null>(null);
export function AuthProvider({ children }: { children: JSX.Element }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    onAuthChange((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        console.info('Logged in: ', currentUser);
      } else {
        console.info('Logged out');
      }
    });
  }, []);

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
