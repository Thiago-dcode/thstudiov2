import { Playfair_Display,Lora, Jost } from "next/font/google";

export const playfair = Lora({
  subsets: ["latin"],
  weight: ["400","400", "400"],
  style: ["normal"],
  variable: "--font-brand",
  display: "swap",
});

export const dmSans = Jost({
  subsets: ["latin"],
  weight: ["400","500", "700"],
  style: ["normal"],
  variable: "--font-body",
  display: "swap",
});
