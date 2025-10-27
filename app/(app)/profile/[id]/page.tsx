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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuthActions, useAuthToken } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Plus,
  LogOut,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Package,
  Settings,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import UserBadge from "@/components/UserBadge";

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

  // Edit profile dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const token = useAuthToken();

  const available = useQuery(api.functions.user.getUsernameAvailability, {
    username,
  });
  const save = useMutation(api.functions.user.updateProfile);

  const themes = useQuery(api.functions.themes.getByUser, {
    userId,
    sort,
    order,
  });

  const { signOut } = useAuthActions();

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

  if (user === undefined) {
    return null;
  }

  if (user === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">😕</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Gebruiker niet gevonden</h2>
          <p className="text-muted-foreground mb-6">
            Deze gebruiker bestaat niet of is verwijderd
          </p>
          <Link href="/">
            <Button>Terug naar home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = user.id === currentUser?.id;

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-8">
        <Avatar className="w-24 h-24 mb-4 border-4 border-background shadow-lg">
          <AvatarImage
            src={user.image || undefined}
            alt={user.name}
            className="object-cover"
          />
          <AvatarFallback className="text-3xl">
            {user.name ? user.name.charAt(0).toUpperCase() : "?"}
          </AvatarFallback>
        </Avatar>

        <div className="text-4xl font-bold mb-2 flex items-center gap-2">
          {user.name}
          <UserBadge role={user.role} />
        </div>

        {themes && (
          <p className="text-muted-foreground text-lg">
            {themes.length} {themes.length === 1 ? "thema" : "thema's"}
          </p>
        )}
      </div>

      {/* Action Buttons for Own Profile */}
      {isOwnProfile && (
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          <Link href="/create">
            <Button size="lg" className="gap-2">
              <Plus className="w-4 h-4" />
              Nieuw thema
            </Button>
          </Link>

          <Button
            size="lg"
            variant="outline"
            className="gap-2"
            onClick={() => setDialogOpen(true)}
          >
            <Settings className="w-4 h-4" />
            Profiel bewerken
          </Button>

          <Button
            size="lg"
            onClick={() => signOut()}
            variant="outline"
            className="gap-2 text-destructive hover:text-destructive"
          >
            <LogOut className="w-4 h-4" />
            Uitloggen
          </Button>
        </div>
      )}

      {/* Edit Profile Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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

      {/* Divider */}
      <div className="border-t mb-8" />

      {/* Themes Section */}
      {themes && themes.length > 0 ? (
        <>
          {/* Sort Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="text-sm font-medium text-muted-foreground">
              Sorteren:
            </span>
            <Select
              onValueChange={(value) =>
                setSort(value as "downloads" | "rating" | "date")
              }
              value={sort}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="downloads">Downloads</SelectItem>
                <SelectItem value="rating">Beoordeling</SelectItem>
                <SelectItem value="date">Datum</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setOrder(order === "desc" ? "asc" : "desc")}
              className="gap-2"
            >
              {order === "desc" ? (
                <ArrowDownWideNarrow className="w-4 h-4" />
              ) : (
                <ArrowUpNarrowWide className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Themes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {themes.map((theme) => (
              <Theme
                key={theme.id}
                theme={theme}
                preview={"preview" in theme ? theme.preview : false}
                canEdit={isOwnProfile}
              />
            ))}
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {isOwnProfile
              ? "Je hebt nog geen thema's"
              : "Deze gebruiker heeft nog geen thema's"}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            {isOwnProfile
              ? "Begin met het maken van je eerste thema om deze te delen met de community"
              : "Check later terug om te zien of er nieuwe thema's zijn toegevoegd"}
          </p>
          {isOwnProfile && (
            <Link href="/create">
              <Button size="lg" className="gap-2">
                <Plus className="w-4 h-4" />
                Maak je eerste thema
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
