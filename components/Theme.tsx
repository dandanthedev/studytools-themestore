import Link from "next/link";
import ThemePreview from "./ThemePreview";
import { Button } from "./ui/button";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export default function Theme({
  id,
  name,
  description,
  user,
  data,
  preview,
  canEdit,
}: {
  id: string;
  name: string;
  description: string;
  user?: {
    id: string;
    name: string;
  };
  data: string;
  preview?: boolean;
  canEdit?: boolean;
}) {
  const parsed = JSON.parse(data);
  const logDownload = useMutation(api.functions.themes.logDownload);
  return (
    <div className="flex flex-col gap-4 bg-secondary items-center max-w-67 p-2 rounded-lg border">
      <ThemePreview style={parsed} />
      <h1 className="text-3xl text-center text-foreground font-bold">{name}</h1>
      <p className="text-center text-muted-foreground text-md">{description}</p>
      {user && (
        <p className="text-center text-muted-foreground text-md">
          door <Link href={`/profile/${user.id}`}>{user.name}</Link>
        </p>
      )}
      <Button
        onClick={() => {
          logDownload({ id: id as Id<"themes"> });
          //convert data to a .sttheme file and download
          const blob = new Blob([data], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${name}.sttheme`;
          link.click();
          URL.revokeObjectURL(url);
          link.remove();
        }}
      >
        Downloaden
      </Button>

      {canEdit && <Link href={`/theme/${id}`}>Bewerken</Link>}

      {preview && <p>(concept)</p>}
    </div>
  );
}
