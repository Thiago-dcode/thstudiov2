import { Archivo, Jost } from "next/font/google";

export const brand = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal"],
  variable: "--font-brand",
  display: "swap",
});

export const body = Jost({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal"],
  variable: "--font-body",
  display: "swap",
});
