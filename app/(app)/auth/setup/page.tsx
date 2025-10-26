"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useAuthToken } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";

export default function Setup() {
  const [username, setUsername] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const token = useAuthToken();

  const available = useQuery(api.functions.user.getUsernameAvailability, {
    username,
  });
  const save = useMutation(api.functions.user.updateProfile);

  useEffect(() => {
    if (file && file.size > 1024 * 1024) {
      setError("Maximale bestandsgrootte is 1MB");
    }
  }, [file]);

  return (
    <>
      <h1 className="text-4xl text-center text-foreground font-bold">
        Welkom!
      </h1>
      <p className="text-center text-muted-foreground text-md">
        Maak je profiel compleet door de volgende gegevens in te vullen
      </p>

      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();

          if (file) {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_CONVEX_SITE_URL}/updatePicture`,
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
        {available === false && (
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

        <Button type="submit">Profiel opslaan</Button>
      </form>
    </>
  );
}
