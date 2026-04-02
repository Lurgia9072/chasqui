import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const useUserVehiculoAllInfo = (userId: string | undefined) => {
  const [vehiculo, setVehiculo] = useState<{ tipo: string; placa: string; capacidad: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(doc(db, 'users', userId), (snapshot) => {
      if (snapshot.exists()) {
        setVehiculo(snapshot.data().vehiculo || null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching all user vehicle info:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { vehiculo, loading };
};
