import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const useUserTelefonoAllInfo = (userId: string | undefined) => {
  const [telefono, setTelefono] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(doc(db, 'users', userId), (snapshot) => {
      if (snapshot.exists()) {
        setTelefono(snapshot.data().telefono);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching all user phone info:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { telefono, loading };
};
