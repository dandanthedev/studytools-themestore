"use client";
import { Roboto } from "next/font/google";
import "./globals.css";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import Header from "@/components/Header";
import { ConvexReactClient } from "convex/react";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${roboto.className} antialiased min-h-screen`}>
        <ConvexAuthProvider client={convex}>
          <Header />
          {children}
          <p className="fixed bottom-2 left-0 right-0 text-center text-sm text-muted-foreground">
            De StudyTools Marketplace is een onofficieel community-project en is
            dus niet gelinked aan Quinten of StudyTools in het algemeen.
          </p>
        </ConvexAuthProvider>
      </body>
    </html>
  );
}
