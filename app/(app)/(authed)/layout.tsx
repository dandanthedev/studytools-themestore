"use client";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthHandlerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useQuery(api.functions.user.get);
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (user === null) {
      router.push("/auth/login?redirect=" + pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;
  return <>{children}</>;
}
