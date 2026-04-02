import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { AccountType } from '../types';

export const useUserAccountTypeAll = (userId: string | undefined) => {
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(doc(db, 'users', userId), (snapshot) => {
      if (snapshot.exists()) {
        setAccountType(snapshot.data().tipoCuenta as AccountType);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching all user account type info:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { accountType, loading };
};
