import { Archivo, SUSE } from "next/font/google";

export const brand = Archivo({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal"],
  variable: "--font-brand",
  display: "swap",
});

export const body = SUSE({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal"],
  variable: "--font-body",
  display: "swap",
});
