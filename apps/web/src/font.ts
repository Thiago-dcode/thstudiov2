import { Jost, Lato } from "next/font/google";

export const playfair = Lato({
  subsets: ["latin"],
  weight: ["700"],
  style: ["normal"],
  variable: "--font-brand",
  display: "swap",
});

export const dmSans = Jost({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal"],
  variable: "--font-body",
  display: "swap",
});
