'use client'

import { TimerOptions, useTimer } from "../../hooks/useTimer";

export const Timer = ({ expiresIn, options }: { expiresIn: number, options?: TimerOptions }) => {

 const { timeObj } = useTimer(expiresIn, options);
 const appendZero = (num: number) => {

 if (num < 10) {
 return `0${num}`
 }
 return num;
 }
 const beutifyTimeObj = (time: typeof timeObj) => {
 if (!time) return '';
 const { minutes, seconds } = time;
 return `${appendZero(minutes)}:${appendZero(seconds)}`


 }

 return (<>
 <p>{beutifyTimeObj(timeObj)}</p>
 </>)
}