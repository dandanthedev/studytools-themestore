"use client";

import Theme from "@/components/Theme";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [sort, setSort] = useState<"downloads" | "rating" | "date">(
    "downloads"
  );
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [searchQuery, setSearchQuery] = useState("");

  const themes = useQuery(api.functions.themes.list, {
    sort,
    order,
  });

  const user = useQuery(api.functions.user.get);

  // Filter themes based on search query
  const filteredThemes = themes?.filter((theme) => {
    const query = searchQuery.toLowerCase();
    return (
      theme.name.toLowerCase().includes(query) ||
      theme.description.toLowerCase().includes(query) ||
      theme.user.name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Zoek thema's..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3">
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
          >
            {order === "desc" ? (
              <ArrowDownWideNarrow className="w-4 h-4" />
            ) : (
              <ArrowUpNarrowWide className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Themes Grid */}
      {filteredThemes && filteredThemes.length > 0 ? (
        <>
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground">
              {filteredThemes.length}{" "}
              {filteredThemes.length === 1 ? "thema" : "thema's"} gevonden
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredThemes.map((theme) => (
              <Theme
                key={theme.id}
                theme={theme}
                canEdit={theme.user.id === user?.id}
              />
            ))}
          </div>
        </>
      ) : themes === undefined ? (
        /* Loading State */
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Laden...</p>
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {searchQuery ? "Geen thema's gevonden" : "Er zijn nog geen thema's"}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            {searchQuery
              ? "Probeer een andere zoekterm"
              : "Wees de eerste om een thema te maken!"}
          </p>
          {!searchQuery && user && (
            <Link href="/create">
              <Button size="lg" className="gap-2">
                <Plus className="w-4 h-4" />
                Maak het eerste thema
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
