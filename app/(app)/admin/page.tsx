"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

export default function Admin() {
  const isAdmin = useQuery(api.functions.admin.isAdmin);

  if (isAdmin === undefined) return null;
  if (isAdmin === false)
    return (
      <p className="text-center mt-2">Je hebt geen toegang tot deze pagina</p>
    );
  if (isAdmin) return <AdminInner />;
}

function download(id: string, data: string) {
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${id}.sttheme`;
  link.click();
  URL.revokeObjectURL(url);
  link.remove();
}

function AdminInner() {
  const themesToReview = useQuery(api.functions.admin.themesToReview);
  const sendResponse = useMutation(api.functions.admin.sendResponse);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Oude naam</TableHead>
          <TableHead>Nieuwe naam</TableHead>
          <TableHead>Oude beschrijving</TableHead>
          <TableHead>Nieuwe beschrijving</TableHead>
          <TableHead>Oude data</TableHead>
          <TableHead>Nieuwe data</TableHead>
          <TableHead>Actie</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {themesToReview?.map((theme) => (
          <TableRow key={theme.update._id}>
            <TableCell>{theme.original?.name ?? "(Geen)"}</TableCell>
            <TableCell>{theme.update.name}</TableCell>

            <TableCell>{theme.original?.description ?? "(Geen)"}</TableCell>
            <TableCell>{theme.update.description}</TableCell>

            <TableCell>
              <Button
                onClick={() =>
                  download(
                    theme.original?._id ?? "",
                    theme.original?.data ?? ""
                  )
                }
                disabled={theme.original?.data.length === 0}
              >
                Download
              </Button>
            </TableCell>
            <TableCell>
              <Button
                onClick={() =>
                  download(theme.update._id, theme.update?.data ?? "")
                }
              >
                Download{" "}
                {theme.update.data === theme.original?.data
                  ? ""
                  : "(aangepast)"}
              </Button>
            </TableCell>
            <TableCell>
              <Button
                className="mr-2"
                onClick={() => {
                  if (
                    !confirm("Weet je zeker dat je dit thema wilt goedkeuren?")
                  )
                    return;
                  sendResponse({
                    id: theme.update._id,
                    accepted: true,
                    reason: "Goedgekeurd op " + new Date().toLocaleString(),
                  });
                }}
              >
                V
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  const reason = prompt("Reden voor afkeuring");
                  if (!reason) return;
                  if (!confirm("Verzenden met reden: " + reason + "?")) return;
                  sendResponse({
                    id: theme.update._id,
                    accepted: false,
                    reason:
                      "Afgekeurd op " +
                      new Date().toLocaleString() +
                      ": " +
                      reason,
                  });
                }}
              >
                X
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
