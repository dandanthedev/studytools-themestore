"use client";

import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuthActions } from "@convex-dev/auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
export default function EmailVerification() {
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const { signIn } = useAuthActions();

  if (!searchParams.get("email")) return <p>Email niet gevonden</p>;

  return (
    <>
      <h1 className="text-4xl text-center text-foreground font-bold">
        E-mailverificatie
      </h1>
      <p className="text-center text-muted-foreground text-md">
        Je hebt een e-mail ontvangen met een verificatiecode. Vul deze hieronder
        in.
      </p>
      <form
        className="flex flex-col gap-4 w-full"
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const res = await signIn("password", formData).catch(() => {
            //todo: convex moet zn errors fiksen
            setError("Code is onjuist of verlopen");
          });

          console.log(res);
        }}
      >
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
        <input type="hidden" name="flow" value="email-verification" />
        <input
          name="email"
          type="hidden"
          value={searchParams.get("email") || ""}
        />
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <Button disabled={code.length < 6}>Verifieren</Button>
      </form>
    </>
  );
}
