import { Lora, Noto_Sans } from "next/font/google";

export const playfair = Noto_Sans({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal"],
  variable: "--font-brand",
  display: "swap",
});

export const dmSans = Lora({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal"],
  variable: "--font-body",
  display: "swap",
});
