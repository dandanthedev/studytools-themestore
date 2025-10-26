"use client";

import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthActions } from "@convex-dev/auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AlertCircle, ShieldCheck } from "lucide-react";

export default function EmailVerificationWrapper() {
  return (
    <Suspense>
      <EmailVerification />
    </Suspense>
  );
}

function EmailVerification() {
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuthActions();

  const email = searchParams.get("email");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    setError("");
    setIsLoading(true);

    try {
      await signIn("password", formData);
    } catch {
      setError("Code is onjuist of verlopen");
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="container max-w-md mx-auto py-16 px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">E-mail niet gevonden</h2>
          <p className="text-muted-foreground">
            Er is geen e-mailadres opgegeven voor verificatie
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto py-16 px-4">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Verifieer je e-mail</h1>
          <p className="text-muted-foreground">
            We hebben een 6-cijferige code gestuurd naar
          </p>
          <p className="font-medium">{email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                name="code"
                required
                value={code}
                onChange={(e) => setCode(e)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          <input type="hidden" name="flow" value="email-verification" />
          <input name="email" type="hidden" value={email} />

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
            disabled={code.length < 6 || isLoading}
          >
            <ShieldCheck className="w-4 h-4" />
            {isLoading ? "Verifiëren..." : "Verifieer"}
          </Button>
        </form>

        {/* Help Text */}
        <div className="text-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Geen code ontvangen? Check je spam folder of probeer opnieuw in te
            loggen
          </p>
        </div>
      </div>
    </div>
  );
}
