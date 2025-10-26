"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserPlus, AlertCircle } from "lucide-react";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuthActions();
  const router = useRouter();

  const passwordsMatch = password === passwordConfirm || !passwordConfirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    setError("");
    setIsLoading(true);

    try {
      await signIn("password", formData);

      router.replace("/auth/email?email=" + username);
    } catch {
      setError(
        "Account kon niet aangemaakt worden. Misschien is de e-mail al in gebruik?"
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto py-16 px-4">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Account aanmaken</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mailadres</Label>
            <Input
              id="email"
              type="email"
              placeholder="jouw@email.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              name="email"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Wachtwoord</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimaal 8 tekens"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              name="password"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">Wachtwoord bevestigen</Label>
            <Input
              id="passwordConfirm"
              type="password"
              placeholder="Herhaal je wachtwoord"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
              className={!passwordsMatch ? "border-red-500" : ""}
            />
            {!passwordsMatch && passwordConfirm && (
              <p className="text-sm text-red-500">
                Wachtwoorden komen niet overeen
              </p>
            )}
          </div>

          <input type="hidden" name="flow" value="signUp" />

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full gap-2"
            size="lg"
            disabled={!username || !password || !passwordsMatch || isLoading}
          >
            <UserPlus className="w-4 h-4" />
            {isLoading ? "Account aanmaken..." : "Registreer"}
          </Button>
        </form>

        {/* Sign In Link */}
        <p className="text-center text-sm text-muted-foreground">
          Al een account?{" "}
          <Link
            href="/auth/login"
            className="text-primary hover:underline font-medium"
          >
            Log hier in
          </Link>
        </p>
      </div>
    </div>
  );
}
