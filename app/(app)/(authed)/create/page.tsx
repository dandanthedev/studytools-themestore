"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, AlertCircle } from "lucide-react";

export default function Create() {
  const create = useMutation(api.functions.myThemes.create);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsCreating(true);

    const formData = new FormData(e.target as HTMLFormElement);

    try {
      const id = await create({
        name: formData.get("name") as string,
        description: formData.get("description") as string,
      });

      if (id) {
        router.push(`/theme/${id}`);
      }
    } catch (e) {
      //@ts-expect-error ik fiks dit ooit
      setError(e.data || e.message);
      setIsCreating(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Nieuw thema aanmaken</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">
            Naam <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Bijv. Dark Mode Pro"
            name="name"
            required
            maxLength={50}
          />
          <p className="text-sm text-muted-foreground">
            Geef je thema een duidelijke en herkenbare naam
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Beschrijving <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Vertel iets over je thema..."
            name="description"
            required
            maxLength={200}
            rows={4}
          />
          <p className="text-sm text-muted-foreground">
            Beschrijf wat je thema uniek maakt (max 200 tekens)
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="pt-4">
          <Button
            type="submit"
            size="lg"
            className="w-full gap-2"
            disabled={isCreating}
          >
            <Plus className="w-4 h-4" />
            {isCreating ? "Thema aanmaken..." : "Thema aanmaken"}
          </Button>
        </div>
      </form>
    </div>
  );
}
