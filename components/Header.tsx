"use client";

import Image from "next/image";
import { Button } from "./ui/button";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Link from "next/link";
import { Github, LogOut, Plus, Shield, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuthActions } from "@convex-dev/auth/react";

export default function Header() {
  const user = useQuery(api.functions.user.get);
  const isAdmin = useQuery(api.functions.admin.isAdmin);
  const { signOut } = useAuthActions();
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label="Account menu">
                <Avatar className="size-12">
                  <AvatarImage
                    src={user.image || undefined}
                    alt={user.name}
                    className="object-cover"
                  />
                  <AvatarFallback>
                    {user.name ? user.name.charAt(0) : "?"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  href={`/profile/${user.id}`}
                  className="flex items-center gap-2"
                >
                  <User className="size-4" />
                  Profiel
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="flex items-center gap-2">
                    <Shield className="size-4" />
                    Admin
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/create" className="flex items-center gap-2">
                  <Plus className="size-4" />
                  Nieuw thema
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href="https://github.com/dandanthedev/studytools-themestore"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2"
                >
                  <Github className="size-4" />
                  GitHub
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  signOut();
                }}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <LogOut className="size-4" />
                Uitloggen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div className="flex flex-row gap-4 items-center">
          <Link href="/auth/login">
            <Button className="cursor-pointer" variant="secondary">
              Inloggen
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
