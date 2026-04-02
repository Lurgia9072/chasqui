import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const useUserCreatedAtAll = (userId: string | undefined) => {
  const [createdAt, setCreatedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(doc(db, 'users', userId), (snapshot) => {
      if (snapshot.exists()) {
        setCreatedAt(snapshot.data().createdAt);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching all user created at info:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { createdAt, loading };
};
