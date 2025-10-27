"use client";
import React, { useEffect, useState } from "react";
import { Roboto } from "next/font/google";
import "./globals.css";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import Header from "@/components/Header";
import { ConvexReactClient } from "convex/react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const pathname = usePathname();
  const preview = pathname === "/preview";
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!preview) {
      const seen = localStorage.getItem("stm_seenDisclaimer");
      if (!seen) setOpen(true);
    }
  }, [preview]);

  return (
    <html lang="en">
      <body className={`${roboto.className} antialiased min-h-screen`}>
        <ConvexAuthProvider client={convex}>
          {!preview && <Header />}

          <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
              setOpen(nextOpen);
              if (!nextOpen) {
                localStorage.setItem("stm_seenDisclaimer", "1");
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Let op</DialogTitle>
                <DialogDescription>
                  De StudyTools Marketplace is een onofficieel community-project en is dus niet gelinked aan Quinten of StudyTools in het algemeen.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setOpen(false);
                    localStorage.setItem("stm_seenDisclaimer", "1");
                  }}
                >
                  Ik begrijp het
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {children}
        </ConvexAuthProvider>
      </body>
    </html>
  );
}
