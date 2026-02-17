"use client";

import { useState, useEffect, useActionState, startTransition } from "react";
import { PinPad } from "@/components/pin-pad";
import { loginAction } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [state, formAction, isPending] = useActionState(loginAction, null);

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (pin.length === 4) {
      const formData = new FormData();
      formData.set("pin", pin);
      startTransition(() => {
        formAction(formData);
      });
      // Reset PIN after attempt
      setTimeout(() => setPin(""), 500);
    }
  }, [pin, formAction]);

  useEffect(() => {
    if (state?.success) {
      router.replace("/");
    }
  }, [state, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Warehouse Inventory
          </h1>
          <p className="text-sm text-gray-500 mt-1">Enter your PIN to log in</p>
        </div>

        <PinPad
          value={pin}
          onChange={setPin}
          error={state?.error}
        />

        {isPending && (
          <p className="text-center text-sm text-blue-600 mt-4 animate-pulse">
            Signing in...
          </p>
        )}
      </div>
    </div>
  );
}
