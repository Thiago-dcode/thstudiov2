'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
export type TimerOptions = {
  onFinish?: () => Promise<void>;
};
export type TimeObj = {
  minutes: number;
  seconds: number;
}
export const useTimer = (expireIn: number, options?: TimerOptions) => {
  const [timeObj, setTimeObj] = useState<TimeObj>();
  const expireDate = useRef(new Date(new Date().getTime() + expireIn));
  const [finished, setFinished] = useState(false);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  const setTime = useCallback((expireDate: Date) => {
    const diff = expireDate.getTime() - new Date().getTime();
    setFinished(diff <= 0);
   if(diff >=0){
    const minutes = Math.floor(diff / 1000 / 60);
    const remainder = diff / 1000 / 60 - (minutes % 60);
    const seconds = Math.floor(remainder * 60);
    setTimeObj({
      minutes,
      seconds,
    });
   }

  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setTime(expireDate.current);
    }, 1000);

    intervalIdRef.current = id;
    return () => {
      clearInterval(id);
      intervalIdRef.current = null;
    };
  }, [setTime]);

  useEffect(() => {
    if (finished) {
      if (options?.onFinish) {
        options.onFinish();
      }

      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  return {
    timeObj,
    finished,
  };
};
