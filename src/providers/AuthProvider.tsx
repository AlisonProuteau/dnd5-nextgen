import { getUserData } from '@api/users';
import { useQuery } from '@tanstack/react-query';
import type { Version } from '@utils/versions.constants';
import { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type JSX } from 'react';
import { onAuthChange } from 'src/firebase';

const AuthContext = createContext<[User | null, boolean, Version | null]>([null, true, null]);
export function AuthProvider({ children }: { children: JSX.Element }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { data: currentUserVersion = null, isLoading: isUserVersionLoading = true } = useQuery({
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
    <AuthContext.Provider value={[user, isLoading || isUserVersionLoading, currentUserVersion]}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
