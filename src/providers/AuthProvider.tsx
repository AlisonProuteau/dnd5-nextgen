import { getUserData } from '@api/users';
import { useQuery } from '@tanstack/react-query';
import type { Version } from '@utils/constants';
import { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type JSX } from 'react';
import { onAuthChange } from 'src/firebase';

interface AuthContextProps {
  user: User | null;
  isLoading: boolean;
  version?: Version;
}

const AuthContext = createContext<AuthContextProps>({ user: null, isLoading: true });
export function AuthProvider({ children }: { children: JSX.Element }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { data: version, isLoading: isUserVersionLoading = true } = useQuery({
    queryKey: ['fetchUserData', user?.uid],
    queryFn: async () => (user?.uid && (await getUserData(user.uid))) || null,
    select: (data) => data?.version,
    enabled: !isLoading && !!user?.uid
  });

  useEffect(() => {
    onAuthChange((currentUser) => {
      setIsLoading(false);
      setUser(currentUser);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading: isLoading || isUserVersionLoading, version }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
