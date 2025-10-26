"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="container max-w-2xl mx-auto px-4 flex items-center justify-center min-h-[70vh]">
      <div className="text-center space-y-6">
        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Pagina niet gevonden</h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            De pagina die je zoekt bestaat niet of is verplaatst
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center pt-4">
          <Button
            size="lg"
            onClick={() => router.back()}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Ga terug
          </Button>
          <Link href="/">
            <Button size="lg" className="gap-2">
              <Home className="w-4 h-4" />
              Naar homepagina
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
