import {Lato, Noto_Sans, Jost } from "next/font/google";

export const playfair = Noto_Sans({
  subsets: ["latin"],
  weight: ["200", "400", "600", "800"],
  style: ["normal"],
  variable: "--font-brand",
  display: "swap",
});

export const dmSans =Jost({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal"],
  variable: "--font-body",
  display: "swap",
});
