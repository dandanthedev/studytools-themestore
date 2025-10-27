import Link from "next/link";
import { Button } from "./ui/button";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ThumbsUp, ThumbsDown, Download, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import UserBadge from "./UserBadge";

export default function Theme({
  theme,
  preview,
  canEdit,
}: {
  theme: {
    id: Id<"themes">;
    name: string;
    description: string;
    user?: {
      id: string;
      name?: string;
      role?: "admin" | "trusted";
    };
    data: string;
    preview?: boolean;
    canEdit?: boolean;
    likes?: number;
    dislikes?: number;
    downloads?: number;
  };
  preview?: boolean;
  canEdit?: boolean;
}) {
  const logDownload = useMutation(api.functions.themes.logDownload);
  const userRatingStatus = useQuery(api.functions.themes.userRatingStatus, {
    id: theme.id,
  });
  const signedIn = useQuery(api.functions.user.get);

  const rate = useMutation(api.functions.themes.rate);

  const totalVotes = (theme?.likes || 0) + (theme?.dislikes || 0);
  const rating = totalVotes > 0 ? ((theme.likes || 0) / totalVotes) * 100 : 0;

  const hasLiked = userRatingStatus === "like";
  const hasDisliked = userRatingStatus === "dislike";

  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const pathname = usePathname();
  const loginHref = `/auth/login?redirect=${encodeURIComponent(pathname)}`;

  return (
    <div className="group relative flex flex-col overflow-hidden bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200">
      {/* Preview Section */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <iframe
          src={`/preview?id=${theme.id}`}
          className="w-full h-full border-0"
        />
        {preview && (
          <div className="absolute top-3 right-3 bg-yellow-500/90 text-yellow-950 text-xs font-medium px-2.5 py-1 rounded-full">
            Concept
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col gap-3 p-5">
        {/* Title and Description */}
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-bold text-foreground leading-tight">
            {theme.name}
          </h2>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {theme.description}
          </p>
        </div>

        {/* Author */}
        {theme.user && (
          <Link
            href={`/profile/${theme.user.id}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit flex items-center"
          >
            <div className="flex items-center gap-1">
              door{" "}
              <span className="font-medium">{theme.user.name ?? "(Geen)"}</span>
              <div className="w-4 h-4">
                <UserBadge role={theme.user.role} size={16} />
              </div>
            </div>
          </Link>
        )}

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {/* Downloads */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Download className="w-4 h-4" />
              <span className="font-medium">{theme.downloads}</span>
            </div>

            {/* Rating */}
            {totalVotes > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-1.5">
                  <ThumbsUp className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-foreground">
                    {rating.toFixed(0)}%
                  </span>
                  <span className="text-muted-foreground text-xs">
                    ({totalVotes})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Like Button */}
          <Button
            disabled={signedIn === undefined}
            variant={hasLiked ? "default" : "outline"}
            size="sm"
            className={cn(
              "flex-1 gap-2 transition-all",
              hasLiked &&
                "bg-green-600 hover:bg-green-700 text-white border-green-600"
            )}
            onClick={() => {
              if (!signedIn) {
                setLoginPromptOpen(true);
                return;
              }
              rate({ id: theme.id, status: "like" });
            }}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{theme.likes}</span>
          </Button>

          {/* Dislike Button */}
          <Button
            disabled={signedIn === undefined}
            variant={hasDisliked ? "default" : "outline"}
            size="sm"
            className={cn(
              "flex-1 gap-2 transition-all",
              hasDisliked &&
                "bg-red-600 hover:bg-red-700 text-white border-red-600"
            )}
            onClick={() => {
              if (!signedIn) {
                setLoginPromptOpen(true);
                return;
              }
              rate({ id: theme.id, status: "dislike" });
            }}
          >
            <ThumbsDown className="w-4 h-4" />
            <span>{theme.dislikes}</span>
          </Button>
        </div>

        {/* Download Button */}
        <Button
          size="lg"
          className="w-full gap-2 font-semibold"
          onClick={() => {
            logDownload({ id: theme.id });
            const blob = new Blob([theme.data], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${theme.name}.sttheme`;
            link.click();
            URL.revokeObjectURL(url);
            link.remove();
          }}
        >
          <Download className="w-4 h-4" />
          Downloaden
        </Button>

        {/* Edit Link */}
        {canEdit && (
          <Link
            href={`/theme/${theme.id}`}
            className="flex items-center justify-center gap-2 text-sm text-primary hover:underline font-medium py-1"
          >
            <Edit className="w-3.5 h-3.5" />
            Bewerken
          </Link>
        )}
      </div>
      <Dialog open={loginPromptOpen} onOpenChange={setLoginPromptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inloggen vereist</DialogTitle>
            <DialogDescription>
              Log in om te kunnen liken of disliken.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoginPromptOpen(false)}>
              Annuleren
            </Button>
            <Button asChild>
              <Link href={loginHref}>Inloggen</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
