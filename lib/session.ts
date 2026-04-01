import { verifyToken } from "@/lib/auth";

type JwtPayload = {
  userId?: string;
};

export function getUserIdFromAccessToken(token: string | undefined) {
  if (!token) return null;

  try {
    const decoded = verifyToken(token);

    if (typeof decoded === "string") return null;
    const payload = decoded as JwtPayload;
    return payload.userId ?? null;
  } catch {
    return null;
  }
}

export function getAccessTokenFromCookieHeader(cookieHeader: string) {
  const tokenCookie = cookieHeader
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith("access_token="));

  if (!tokenCookie) return undefined;
  return tokenCookie.split("=")[1];
}
