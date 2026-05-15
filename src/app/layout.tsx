import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkClientProvider } from "@/components/providers/clerk-provider";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { PocketMoneyProvider } from "@/components/providers/PocketMoneyProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { UserSync } from "@/components/shared/user-sync";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pirate Money | Earn Yen!",
  description: "Earn Yen by helping around the house!",
  applicationName: "Pirate Money",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Pirate Money",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e7490",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <LanguageProvider>
          <ClerkClientProvider>
            <ConvexClientProvider>
              <PocketMoneyProvider>
                <UserSync />
                {children}
              </PocketMoneyProvider>
              <Toaster />
            </ConvexClientProvider>
          </ClerkClientProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
