import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const useUserEmailAll = (userId: string | undefined) => {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(doc(db, 'users', userId), (snapshot) => {
      if (snapshot.exists()) {
        setEmail(snapshot.data().email);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching all user email info:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { email, loading };
};
