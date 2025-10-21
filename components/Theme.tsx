import Link from "next/link";
import ThemePreview from "./ThemePreview";
import { Button } from "./ui/button";

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
  return (
    <div className="flex flex-col gap-4 bg-secondary items-center max-w-67 p-2 rounded-lg border">
      <div className="w-64 h-32">
        <ThemePreview style={parsed} />
      </div>
      <h1 className="text-3xl text-center text-foreground font-bold">{name}</h1>
      <p className="text-center text-muted-foreground text-md">{description}</p>
      {user && (
        <p className="text-center text-muted-foreground text-md">
          door <Link href={`/profile/${user.id}`}>{user.name}</Link>
        </p>
      )}
      <Button
        onClick={() => {
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

      {preview && <p>(voorbeeld)</p>}
    </div>
  );
}
