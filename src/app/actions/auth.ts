"use server";

import { authenticateWithPin, createSession, destroySession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const pin = formData.get("pin") as string;

  if (!pin || pin.length !== 4) {
    return { error: "Enter a 4-digit PIN", success: false };
  }

  const user = await authenticateWithPin(pin);

  if (!user) {
    return { error: "Invalid PIN. Try again.", success: false };
  }

  await createSession(user);
  return { success: true };
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
