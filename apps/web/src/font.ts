import { Poppins } from "next/font/google";

export const brand = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal"],
  variable: "--font-brand",
  display: "swap",
});

export const body = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal"],
  variable: "--font-body",
  display: "swap",
});
