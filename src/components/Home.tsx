import { Fragment } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { CharacterCreation } from './CharacterCreation/CharacterCreation';

export function Home() {
  const user = useAuth();

  return (
    <Fragment>
      {user ? (
        <Fragment>
          {`Hello ${user.email}`}
          <CharacterCreation />
        </Fragment>
      ) : (
        'Welcome stranger'
      )}
    </Fragment>
  );
}
