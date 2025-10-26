"use client";

import Theme from "@/components/Theme";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function Profile() {
  const params = useParams();
  const userId = params.id as Id<"users">;
  const user = useQuery(api.functions.user.getById, {
    id: userId,
  });
  const currentUser = useQuery(api.functions.user.get);

  const [sort, setSort] = useState<"downloads" | "rating" | "date">(
    "downloads"
  );
  const [order, setOrder] = useState<"desc" | "asc">("desc");

  const themes = useQuery(api.functions.themes.getByUser, {
    userId,
    sort,
    order,
  });

  const { signOut } = useAuthActions();

  if (user === undefined) return null;
  if (user === null)
    return <p className="text-red-500">Gebruiker niet gevonden</p>;
  return (
    <>
      <div className="flex gap-4 justify-center w-full p-5 flex-col items-center">
        <Avatar className="size-20">
          <AvatarImage src={user.image || undefined} alt={user.name} />
          <AvatarFallback>
            {user.name ? user.name.charAt(0) : "?"}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-3xl text-center text-foreground font-bold">
          {user.name}
        </h1>
      </div>

      {user.id === currentUser?.id && (
        <div className="flex gap-4 p-3 justify-center">
          <Link href="/create">
            <Button>Nieuw thema aanmaken</Button>
          </Link>
          <Link href="/profile/edit">
            <Button>Profiel bewerken</Button>
          </Link>
          <Button onClick={() => signOut()} variant="destructive">
            Uitloggen
          </Button>
        </div>
      )}

      <div className="flex gap-4 p-3 justify-center">
        <Select
          onValueChange={(value) => setSort(value as "downloads" | "rating")}
          value={sort}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sorteren op..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="downloads">Downloads</SelectItem>
            <SelectItem value="rating">Beoordeling</SelectItem>
            <SelectItem value="date">Datum</SelectItem>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) => setOrder(value as "desc" | "asc")}
          value={order}
        >
          <SelectTrigger>
            <SelectValue placeholder="Volgorde..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Aflopend</SelectItem>
            <SelectItem value="asc">Oplopend</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-4 p-3 items-center justify-center">
        {themes?.map((theme) => (
          <Theme
            id={theme.id}
            key={theme.id}
            name={theme.name}
            description={theme.description}
            data={theme.data}
            preview={"preview" in theme ? theme.preview : false}
            canEdit={user.id === currentUser?.id}
          />
        ))}
      </div>
    </>
  );
}
