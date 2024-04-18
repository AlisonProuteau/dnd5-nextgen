import { collection, getDocs } from 'firebase/firestore';
import { Fragment, useEffect, useState } from 'react';
import { database } from '../firebase';
import { useAuth } from '../providers/AuthProvider';
import { CharacterCreation, type CharacterFormData } from './CharacterCreation/CharacterCreation';
import { ClassData } from './CharacterSheet/ClassData';

// TODO: Add + button to create new character
export function Home() {
  const user = useAuth();
  const [characters, setCharacters] = useState<CharacterFormData[]>([]);

  useEffect(() => {
    if (user) {
      const ref = collection(database, `users/${user.uid}/characters`);
      getDocs(ref).then(({ docs }) =>
        setCharacters(docs.map((d) => d.data()) as CharacterFormData[])
      );
    }
  }, []);

  return (
    <Fragment>
      {user ? (
        characters.length ? (
          <ClassData characters={characters} />
        ) : (
          <CharacterCreation />
        )
      ) : (
        'Welcome stranger'
      )}
    </Fragment>
  );
}
