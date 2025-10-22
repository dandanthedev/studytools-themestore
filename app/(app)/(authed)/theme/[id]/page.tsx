"use client";

import ThemePreview from "@/components/ThemePreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Theme() {
  const params = useParams();
  const id = params.id as Id<"themes">;

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

  console.log(theme);

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
          setData(JSON.stringify(data));
        } catch {
          setError("Bestand is geen .sttheme bestand");
        }
      };
      reader.readAsText(files[0]);
    }
  }, [files]);

  return (
    <div className="flex flex-col gap-4 justify-center items-center mt-3 w-full">
      <div className="w-64 h-32">
        <ThemePreview style={JSON.parse(theme?.data.live ?? "{}")} />
      </div>
      <h1 className="text-3xl text-center text-foreground font-bold">
        {theme?.name.live || theme?.name.updated}
      </h1>
      <p className="text-center text-muted-foreground text-md">
        {theme?.description.live || theme?.description.updated}
      </p>

      <h2 className="text-2xl text-center text-foreground font-bold">
        Aanpassen
      </h2>
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          setError("");
          await update({
            id: theme?.id as Id<"themes">,
            name:
              formData.get("name") !== theme?.name.live
                ? (formData.get("name") as string)
                : undefined,
            description:
              formData.get("description") !== theme?.description.live
                ? (formData.get("description") as string)
                : undefined,
            data: data.length > 0 ? data : undefined,
          }).catch(() => {
            setError("Thema kon niet aangepast worden");
          });

          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }}
      >
        <Input
          type="text"
          name="name"
          placeholder="Naam"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
          disabled={awaitingApproval === true}
        />
        <Input
          type="text"
          name="description"
          placeholder="Beschrijving"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
          }}
          disabled={awaitingApproval === true}
        />
        <Dropzone
          accept={{
            ".sttheme": [],
          }}
          onDrop={(files) => {
            setError("");
            console.log(files);
            setFiles(files);
          }}
          onError={(e) => {
            setError(e.message);
          }}
          src={files}
          disabled={awaitingApproval === true}
        >
          <DropzoneEmptyState />
          <DropzoneContent />
        </Dropzone>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <Button type="submit" disabled={awaitingApproval === true || saved}>
          {saved
            ? "Opgeslagen!"
            : awaitingApproval
              ? "Wachten op goedkeuring"
              : "Opslaan"}
        </Button>

        {((theme?.name.updated && theme?.name.live !== theme?.name.updated) ||
          (theme?.description.updated &&
            theme?.description.live !== theme?.description.updated) ||
          (theme?.data.updated &&
            theme?.data.live !== theme?.data.updated)) && (
          <p>Er zijn wijzigingen in afwachting van goedkeuring</p>
        )}

        {theme?.updateNote && (
          <p className="text-sm text-muted-foreground text-center">
            {theme.updateNote}
          </p>
        )}
      </form>

      <div className="flex gap-4 justify-center">
        <Button
          onClick={() => {
            sendForApproval({ id, status: !awaitingApproval });
          }}
          disabled={
            !(
              (theme?.name.updated &&
                theme?.name.live !== theme?.name.updated) ||
              (theme?.description.updated &&
                theme?.description.live !== theme?.description.updated) ||
              (theme?.data.updated && theme?.data.live !== theme?.data.updated)
            )
          }
        >
          {awaitingApproval ? "Beoordeling annuleren" : "Beoordeling aanvragen"}
        </Button>
        {canPublish && (
          <Button
            onClick={() => {
              publish({ id, status: !theme?.published });
            }}
          >
            {theme?.published ? "Thema onpubliceren" : "Thema publiceren"}
          </Button>
        )}
        <Button
          onClick={() => {
            if (!confirm("Weet je zeker dat je dit thema wilt verwijderen?"))
              return;
            remove({ id });
          }}
          variant="destructive"
        >
          Verwijderen
        </Button>
      </div>
    </div>
  );
}
