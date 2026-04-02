import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const useUserNombre = (userId: string | undefined) => {
  const [nombre, setNombre] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(doc(db, 'users', userId), (snapshot) => {
      if (snapshot.exists()) {
        setNombre(snapshot.data().nombre);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user name:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { nombre, loading };
};
