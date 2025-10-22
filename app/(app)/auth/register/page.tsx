"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const { signIn } = useAuthActions();
  const router = useRouter();
  return (
    <>
      <h1 className="text-4xl text-center text-foreground font-bold">
        Account aanmaken
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
              setError(
                "Account kon niet aangemaakt worden. Misschien is de email al in gebruik?"
              );
              return false;
            })
            .then(() => true);

          if (res === false) return;
          router.replace("/auth/email?email=" + username);
        }}
      >
        <Input
          placeholder="E-mail"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          type="email"
          name="email"
          required
        />
        <Input
          placeholder="Wachtwoord"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          name="password"
          required
        />
        <Input
          placeholder="Wachtwoord bevestigen"
          type="password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          style={{
            borderColor: password === passwordConfirm ? undefined : "red",
          }}
          minLength={8}
          required
        />
        <input type="hidden" name="flow" value="signUp" />
        {password !== passwordConfirm && (
          <p className="text-red-500 text-sm">
            Wachtwoorden komen niet overeen
          </p>
        )}

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <Button
          disabled={!username || !password || password !== passwordConfirm}
        >
          Registreer
        </Button>
      </form>
      <p className="text-center text-muted-foreground text-sm">
        Al een account? <Link href="/auth/login">Inloggen</Link>
      </p>
    </>
  );
}
