"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Create() {
  const create = useMutation(api.functions.myThemes.create);
  const [error, setError] = useState("");
  const router = useRouter();

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
          }).catch((e) => {
            setError(e.data || e.message);
          });
          if (id) router.push(`/theme/${id}`);
        }}
      >
        <Input placeholder="Naam" name="name" required />
        <Input placeholder="Beschrijving" name="description" required />

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <Button type="submit">Aanmaken</Button>
      </form>
    </div>
  );
}
