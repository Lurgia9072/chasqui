import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../types';

export const useUser = (userId: string | undefined) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(doc(db, 'users', userId), (snapshot) => {
      if (snapshot.exists()) {
        setUser({ uid: snapshot.id, ...snapshot.data() } as User);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { user, loading };
};
