"use client";

import Image from "next/image";
import { Button } from "./ui/button";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Link from "next/link";

export default function Header() {
  const user = useQuery(api.functions.user.get);
  return (
    <div className="flex flex-row justify-between p-4 bg-primary items-center">
      <Link href="/">
        <Image
          src="/logo-w.png"
          alt="logo"
          width={70}
          height={42}
          priority
          loading={"eager"}
        />
      </Link>
      {user ? (
        <Link href={`/profile/${user.id}`}>
          <Avatar className="size-12">
            <AvatarImage src={user.image || undefined} alt={user.name} />
            <AvatarFallback>
              {user.name ? user.name.charAt(0) : "?"}
            </AvatarFallback>
          </Avatar>
        </Link>
      ) : (
        <Link href="/auth/login">
          <Button variant="secondary" className="cursor-pointer">
            Inloggen
          </Button>
        </Link>
      )}
    </div>
  );
}
