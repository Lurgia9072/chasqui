import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const useUserDocumento = (userId: string | undefined) => {
  const [documento, setDocumento] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(doc(db, 'users', userId), (snapshot) => {
      if (snapshot.exists()) {
        setDocumento(snapshot.data().documento);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user document:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { documento, loading };
};
