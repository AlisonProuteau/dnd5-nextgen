import { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange } from '../firebase';

const AuthContext = createContext<[User | null, boolean]>([null, true]);
export function AuthProvider({ children }: { children: JSX.Element }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    onAuthChange((currentUser) => {
      setIsLoading(false);
      setUser(currentUser);
    });
  }, []);

  return <AuthContext.Provider value={[user, isLoading]}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
