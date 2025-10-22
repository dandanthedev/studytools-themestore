"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signIn } = useAuthActions();
  const router = useRouter();
  return (
    <>
      <h1 className="text-4xl text-center text-foreground font-bold">
        Inloggen
      </h1>
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          setError("");
          const res = await signIn("password", formData)
            .catch(() => {
              //todo: convex moet zn errors fiksen
              setError("Email of wachtwoord is onjuist");
              return false;
            })
            .then(() => true);

          if (res === false) return;

          if (typeof res === "object")
            router.replace("/auth/email?email=" + username);

          console.log(res);
        }}
      >
        <Input
          placeholder="E-mail"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          name="email"
          required
        />
        <Input
          placeholder="Wachtwoord"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          name="password"
          required
        />
        <input type="hidden" name="flow" value="signIn" />
        <Button disabled={!username || !password}>Inloggen</Button>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      </form>
      <p className="text-center text-muted-foreground text-sm">
        Nog geen account? <Link href="/auth/register">Registreer</Link>
      </p>
    </>
  );
}
