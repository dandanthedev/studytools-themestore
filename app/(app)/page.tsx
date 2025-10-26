"use client";

import Theme from "@/components/Theme";
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

export default function Home() {
  const [sort, setSort] = useState<"downloads" | "rating" | "date">(
    "downloads"
  );
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const themes = useQuery(api.functions.themes.list, {
    sort,
    order,
  });

  const user = useQuery(api.functions.user.get);

  return (
    <>
      <div className="flex gap-4 p-3 justify-center">
        <Select
          onValueChange={(value) => setSort(value as "downloads" | "rating")}
          value={sort}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sorteren op..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="downloads">Downloads</SelectItem>
            <SelectItem value="rating">Beoordeling</SelectItem>
            <SelectItem value="date">Datum</SelectItem>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) => setOrder(value as "desc" | "asc")}
          value={order}
        >
          <SelectTrigger>
            <SelectValue placeholder="Volgorde..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Aflopend</SelectItem>
            <SelectItem value="asc">Oplopend</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-3 flex-wrap justify-center p-3">
        {themes?.map((theme) => (
          <div className="w-64 h-32" key={theme.id}>
            <Theme
              id={theme.id}
              key={theme.id}
              name={theme.name}
              description={theme.description}
              data={theme.data}
              user={theme.user}
              canEdit={theme.user.id === user?.id}
            />
          </div>
        ))}
      </div>
    </>
  );
}
