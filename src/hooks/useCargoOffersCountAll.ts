import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const useCargoOffersCountAll = (cargoId: string | undefined) => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cargoId) return;

    const unsubscribe = onSnapshot(collection(db, 'cargas', cargoId, 'offers'), (snapshot) => {
      setCount(snapshot.size);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching all cargo offers count:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [cargoId]);

  return { count, loading };
};
