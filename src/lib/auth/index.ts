import { cookies } from "next/headers";
import { db } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { SessionUser } from "@/types";
import { formatUserDisplayName } from "@/lib/utils";

const SESSION_COOKIE = "warehouse_session";
const SESSION_DURATION = 12 * 60 * 60 * 1000; // 12 hours

interface SessionData {
  userId: string;
  name: string;
  role: "operator" | "admin";
  expiresAt: number;
}

function encodeSession(data: SessionData): string {
  return Buffer.from(JSON.stringify(data)).toString("base64");
}

function decodeSession(token: string): SessionData | null {
  try {
    const data = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    if (data.expiresAt < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function authenticateWithPin(
  pin: string
): Promise<SessionUser | null> {
  const activeUsers = await db
    .select()
    .from(users)
    .where(eq(users.isActive, 1));

  for (const user of activeUsers) {
    const match = await bcrypt.compare(pin, user.pinHash);
    if (match) {
      return {
        id: user.id,
        name: formatUserDisplayName(user.name),
        role: user.role as "operator" | "admin",
      };
    }
  }

  return null;
}

export async function createSession(user: SessionUser): Promise<void> {
  const sessionData: SessionData = {
    userId: user.id,
    name: formatUserDisplayName(user.name),
    role: user.role,
    expiresAt: Date.now() + SESSION_DURATION,
  };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encodeSession(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000,
    path: "/",
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const data = decodeSession(token);
  if (!data) return null;

  return {
    id: data.userId,
    name: formatUserDisplayName(data.name),
    role: data.role,
  };
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}
