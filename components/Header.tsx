"use client";

import Image from "next/image";
import { Button } from "./ui/button";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Link from "next/link";
import { Github, LogOut, Moon, Plus, Shield, Sun, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuthActions } from "@convex-dev/auth/react";
import { useTheme } from "next-themes";

export default function Header() {
  const user = useQuery(api.functions.user.get);
  const isAdmin = useQuery(api.functions.admin.isAdmin);
  const { signOut } = useAuthActions();
  const { setTheme } = useTheme();

  return (
    <div className="flex flex-row justify-between p-4 bg-primary items-center dark:bg-secondary">
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
              <button
                aria-label="Account menu"
                className="dark:border rounded-full"
              >
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                <span className="sr-only">Thema switchen</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Licht
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Donker
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                Systeem
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
