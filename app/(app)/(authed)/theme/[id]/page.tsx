"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Save,
  Send,
  Eye,
  EyeOff,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileUp,
} from "lucide-react";

export default function Theme() {
  const params = useParams();
  const id = params.id as Id<"themes">;

  const router = useRouter();

  const theme = useQuery(api.functions.myThemes.get, {
    id,
  });

  const update = useMutation(api.functions.myThemes.edit);

  const awaitingApproval = useQuery(api.functions.myThemes.awaitingApproval, {
    id,
  });
  const sendForApproval = useMutation(api.functions.myThemes.sendForApproval);

  const canPublish = useQuery(api.functions.myThemes.canPublish, {
    id,
  });
  const publish = useMutation(api.functions.myThemes.publish);

  const remove = useMutation(api.functions.myThemes.remove);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [data, setData] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (theme?.name.updated) setName(theme.name.updated);
    else setName(theme?.name.live || "");
    if (theme?.description.updated) setDescription(theme.description.updated);
    else setDescription(theme?.description.live || "");
  }, [theme]);

  useEffect(() => {
    if (files.length > 0) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
          const data = JSON.parse(text);
          const string = JSON.stringify(data);
          setData(string);
          setError("");
        } catch {
          setError("Bestand is geen geldig .sttheme bestand");
        }
      };
      reader.readAsText(files[0]);
    }
  }, [files]);

  const hasPendingChanges =
    (theme?.name.updated && theme?.name.live !== theme?.name.updated) ||
    (theme?.description.updated &&
      theme?.description.live !== theme?.description.updated) ||
    (theme?.data.updated && theme?.data.live !== theme?.data.updated);

  if (!theme) {
    return null;
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4 space-y-8">
      {/* Header with Preview */}
      <div className="space-y-4">
        <div className="flex items-start gap-6">
          {/* Small Preview */}
          <div className="w-48 h-28 shrink-0 rounded-lg overflow-hidden border bg-muted shadow-sm">
            <iframe
              src={`/preview?id=${theme.id}`}
              className="w-full h-full border-0"
            />
          </div>

          {/* Title and Description */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold mb-2">
              {theme?.name.live || theme?.name.updated}
            </h1>
            <p className="text-muted-foreground">
              {theme?.description.live || theme?.description.updated}
            </p>
          </div>
        </div>
      </div>

      {/* Status Alerts */}
      {awaitingApproval && (
        <Alert className="border-yellow-500 bg-yellow-500/10">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-900 dark:text-yellow-100">
            Dit thema wacht op goedkeuring van een moderator
          </AlertDescription>
        </Alert>
      )}

      {hasPendingChanges && !awaitingApproval && (
        <Alert className="border-blue-500 bg-blue-500/10">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            Er zijn wijzigingen die nog niet zijn ingediend voor goedkeuring
          </AlertDescription>
        </Alert>
      )}

      {theme?.updateNote && (
        <Alert className="border-orange-500 bg-orange-500/10">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900 dark:text-orange-100">
            <span className="font-semibold">Opmerking moderator:</span>{" "}
            {theme.updateNote}
          </AlertDescription>
        </Alert>
      )}

      {saved && (
        <Alert className="border-green-500 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900 dark:text-green-100">
            Wijzigingen succesvol opgeslagen!
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-500 bg-red-500/10" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Divider */}
      <div className="border-t" />

      {/* Edit Form */}
      <div className="space-y-6">
        <form
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            setError("");

            try {
              await update({
                id: theme.id,
                name:
                  formData.get("name") !== theme?.name.live
                    ? (formData.get("name") as string)
                    : undefined,
                description:
                  formData.get("description") !== theme?.description.live
                    ? (formData.get("description") as string)
                    : undefined,
                data: data.length > 0 ? data : undefined,
              });

              setSaved(true);
              setTimeout(() => setSaved(false), 3000);
            } catch (e) {
              //@ts-expect-error ik fiks dit ooit
              setError(e.data || e.message);
            }
          }}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="name">
              Naam
            </label>
            <Input
              id="name"
              type="text"
              name="name"
              placeholder="Naam van je thema"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={awaitingApproval === true}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="description">
              Beschrijving
            </label>
            <Textarea
              id="description"
              name="description"
              placeholder="Vertel iets over je thema..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={awaitingApproval === true}
              rows={3}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Themabestand {files.length > 0 && `(${files[0].name})`}
            </label>
            <Dropzone
              accept={{
                ".sttheme": [],
              }}
              onDrop={(files) => {
                setError("");
                setFiles(files);
              }}
              onError={(e) => {
                setError(e.message);
              }}
              src={files}
              disabled={awaitingApproval === true}
            >
              <DropzoneEmptyState>
                <div className="flex flex-col items-center justify-center gap-2 py-8">
                  <FileUp className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Sleep een .sttheme bestand hierheen of klik om te uploaden
                  </p>
                </div>
              </DropzoneEmptyState>
              <DropzoneContent />
            </Dropzone>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={awaitingApproval === true || saved}
            size="lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {saved
              ? "Opgeslagen!"
              : awaitingApproval
                ? "Wachten op goedkeuring"
                : "Wijzigingen opslaan"}
          </Button>
        </form>
      </div>

      {/* Divider */}
      <div className="border-t" />

      {/* Actions */}
      <div className="space-y-6">
        <div className="space-y-3">
          <Button
            onClick={() => {
              sendForApproval({ id, status: !awaitingApproval }).catch((e) => {
                setError(e.data || e.message);
              });
            }}
            disabled={!hasPendingChanges}
            className="w-full"
            variant={awaitingApproval ? "outline" : "default"}
            size="lg"
          >
            <Send className="w-4 h-4 mr-2" />
            {awaitingApproval
              ? "Beoordeling annuleren"
              : "Beoordeling aanvragen"}
          </Button>

          {canPublish && (
            <Button
              onClick={() => {
                publish({ id, status: !theme?.published });
              }}
              className="w-full"
              variant={theme?.published ? "outline" : "default"}
              size="lg"
            >
              {theme?.published ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Thema verbergen
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Thema publiceren
                </>
              )}
            </Button>
          )}

          <Button
            onClick={() => {
              if (!confirm("Weet je zeker dat je dit thema wilt verwijderen?"))
                return;
              remove({ id });
              router.push("/");
            }}
            variant="destructive"
            className="w-full"
            size="lg"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Thema verwijderen
          </Button>
        </div>
      </div>
    </div>
  );
}
