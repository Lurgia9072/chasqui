import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { CargoStatus } from '../types';

export const useCargoStatus = (cargoId: string | undefined) => {
  const [status, setStatus] = useState<CargoStatus>('abierta');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cargoId) return;

    const unsubscribe = onSnapshot(doc(db, 'cargas', cargoId), (snapshot) => {
      if (snapshot.exists()) {
        setStatus(snapshot.data().estado as CargoStatus);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching cargo status:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [cargoId]);

  return { status, loading };
};
