"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Create() {
  const create = useMutation(api.functions.myThemes.create);
  const [files, setFiles] = useState<File[]>([]);
  const [data, setData] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
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
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const id = await create({
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            data,
          }).catch(() => {
            setError("Thema kon niet aangemaakt worden");
          });
          if (id) router.push(`/theme/${id}`);
        }}
      >
        <Input placeholder="Naam" name="name" required />
        <Input placeholder="Beschrijving" name="description" required />
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
        >
          <DropzoneEmptyState />
          <DropzoneContent />
        </Dropzone>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <Button type="submit" disabled={files.length === 0}>
          Aanmaken
        </Button>
      </form>
    </div>
  );
}
