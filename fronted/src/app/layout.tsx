import type { Metadata } from "next";
import {
  Geist,
  Inter,
  Figtree,
  DM_Sans,
  Fraunces,
  Syne,
} from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TRPCReactProvider } from "@/trpc/client";
import { Toaster } from "react-hot-toast";
import Script from "next/script";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { TooltipProvider } from "@/components/ui/tooltip";
const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

const fontContent = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const fontHeading = Syne({
  variable: "--font-heading",
  // weight:["400"],
  weight: ["500", "700", "800"],
  subsets: ["latin"],
});

const fontSubHeading = Inter({
  variable: "--font-subheading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rowley",
  description: "A secure Video Streaming Platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", figtree.variable)}>
      <body
        className={`${fontContent.variable} ${fontHeading.variable} ${fontSubHeading.variable} antialiased`}
      >
        <Script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4" />
        <TRPCReactProvider>
          <Toaster position="top-right" />
          <NuqsAdapter>
            <TooltipProvider>{children}</TooltipProvider>
          </NuqsAdapter>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
