import type { Metadata } from "next";
import {
  Instrument_Sans,
  Inter,
} from "next/font/google";

import "./globals.css";

import { cn } from "@/lib/utils";
import { TRPCReactProvider } from "@/trpc/client";
import { Toaster } from "react-hot-toast";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { TooltipProvider } from "@/components/ui/tooltip";

const fontContent = Inter({
  variable: "--font-content",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const fontHeading = Instrument_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fontSubHeading = Inter({
  variable: "--font-subheading",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
    <html
      lang="en"
      className={cn(
        fontContent.variable,
        fontHeading.variable,
        fontSubHeading.variable
      )}
    >
      <body className="font-content antialiased">
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