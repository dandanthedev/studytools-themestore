"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useAuthToken } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Setup() {
  const [username, setUsername] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const token = useAuthToken();

  const available = useQuery(api.functions.user.getUsernameAvailability, {
    username,
  });
  const save = useMutation(api.functions.user.updateProfile);
  const user = useQuery(api.functions.user.get);
  useEffect(() => {
    if (file && file.size > 1024 * 1024) {
      setError("Maximale bestandsgrootte is 1MB");
    }
  }, [file]);

  useEffect(() => {
    if (user?.name) setUsername(user.name);
  }, [user]);

  return (
    <div className="max-w-md mx-auto mt-3">
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();

          if (file) {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_CONVEX_FUNCTIONS}/updatePicture`,
              {
                method: "POST",
                body: file,
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            const json = await res.json();
            if (json.error) {
              return setError(json.error);
            }
          }

          await save({ username });
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }}
      >
        <Label htmlFor="username">Gebruikersnaam</Label>
        <Input
          placeholder="Bijv. henk"
          name="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        {available === false && username !== user?.name && (
          <p className="text-red-500 text-sm text-center">
            Gebruikersnaam is niet beschikbaar
          </p>
        )}
        <Label htmlFor="avatar">Profielfoto (optioneel)</Label>
        <Input
          type="file"
          name="avatar"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
          }}
        />

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <Button type="submit" disabled={saved}>
          {saved ? "Opgeslagen!" : "Profiel opslaan"}
        </Button>
        <Link
          href={`/profile/${user?.id}`}
          className="text-center text-muted-foreground text-sm"
        >
          Terug naar profiel
        </Link>
      </form>
    </div>
  );
}
