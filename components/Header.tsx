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
        <div className="flex flex-row gap-4 items-center">
          <Link href={`/create`}>
            <Button className="cursor-pointer" variant="outline">
              Nieuw thema
            </Button>
          </Link>
          <Link href={`/profile/${user.id}`}>
            <Avatar className="size-12">
              <AvatarImage src={user.image || undefined} alt={user.name} />
              <AvatarFallback>
                {user.name ? user.name.charAt(0) : "?"}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      ) : (
        <Link href="/auth/login">
          <Button className="cursor-pointer">Inloggen</Button>
        </Link>
      )}
    </div>
  );
}
