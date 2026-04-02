import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const useUserZonas = (userId: string | undefined) => {
  const [zonas, setZonas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(doc(db, 'users', userId), (snapshot) => {
      if (snapshot.exists()) {
        setZonas(snapshot.data().zonasOperacion || []);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user zones:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { zonas, loading };
};
