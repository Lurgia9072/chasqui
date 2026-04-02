import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const useUserRatingAll = (userId: string | undefined) => {
  const [rating, setRating] = useState(5.0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(doc(db, 'users', userId), (snapshot) => {
      if (snapshot.exists()) {
        setRating(snapshot.data().rating);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching all user rating info:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { rating, loading };
};
