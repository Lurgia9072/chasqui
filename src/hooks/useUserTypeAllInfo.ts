import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { UserRole } from '../types';

export const useUserTypeAllInfo = (userId: string | undefined) => {
  const [type, setType] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(doc(db, 'users', userId), (snapshot) => {
      if (snapshot.exists()) {
        setType(snapshot.data().tipoUsuario as UserRole);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching all user type info:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { type, loading };
};
