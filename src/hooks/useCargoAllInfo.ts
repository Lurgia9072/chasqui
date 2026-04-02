import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Cargo } from '../types';

export const useCargoAllInfo = (cargoId: string | undefined) => {
  const [cargo, setCargo] = useState<Cargo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cargoId) return;

    const unsubscribe = onSnapshot(doc(db, 'cargas', cargoId), (snapshot) => {
      if (snapshot.exists()) {
        setCargo({ id: snapshot.id, ...snapshot.data() } as Cargo);
      } else {
        setCargo(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching all cargo info:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [cargoId]);

  return { cargo, loading };
};
