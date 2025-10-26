"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/convex/_generated/api";
import { useAuthToken } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { useState, useEffect } from "react";
import { Settings, CheckCircle2, AlertCircle } from "lucide-react";

interface EditProfileDialogProps {
  trigger?: React.ReactNode;
}

export default function EditProfileDialog({ trigger }: EditProfileDialogProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const token = useAuthToken();

  const currentUser = useQuery(api.functions.user.get);
  const available = useQuery(api.functions.user.getUsernameAvailability, {
    username,
  });
  const save = useMutation(api.functions.user.updateProfile);

  useEffect(() => {
    if (file && file.size > 1024 * 1024) {
      setError("Maximale bestandsgrootte is 1MB");
    } else if (file) {
      setError("");
    }
  }, [file]);

  useEffect(() => {
    if (currentUser?.name) setUsername(currentUser.name);
  }, [currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
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
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setDialogOpen(false);
        setFile(null);
      }, 2000);
    } catch (e) {
      //@ts-expect-error ik fiks dit ooit
      setError(e.message || "Er is een fout opgetreden");
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Profiel bewerken
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Profiel bewerken</DialogTitle>
          <DialogDescription>
            Pas je gebruikersnaam en profielfoto aan
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSaveProfile} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="username">Gebruikersnaam</Label>
            <Input
              id="username"
              placeholder="Bijv. henk"
              name="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {available === false && username !== currentUser?.name && (
              <p className="text-sm text-red-500">
                Gebruikersnaam is niet beschikbaar
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar">Profielfoto (optioneel, max 1MB)</Label>
            <Input
              id="avatar"
              type="file"
              name="avatar"
              accept="image/*"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
              }}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {saved && (
            <Alert className="border-green-500 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900 dark:text-green-100">
                Profiel succesvol opgeslagen!
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={
              saved || (available === false && username !== currentUser?.name)
            }
          >
            {saved ? "Opgeslagen!" : "Profiel opslaan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
