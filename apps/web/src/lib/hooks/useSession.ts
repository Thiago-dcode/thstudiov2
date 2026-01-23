'use client'

import { useEffect, useState } from 'react';
import { userSession } from '@/modules/auth/server-actions/user-session.action';
import { UserAuth } from '@/modules/auth/auth.types';

export const useSession = () => {
  const [session, setSession] = useState<UserAuth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const userAuth = await userSession();
        
        if (isMounted) {
          setSession(userAuth);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch session'));
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSession();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    session,
    isLoading,
    error,
  };
};

