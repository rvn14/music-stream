import { NextResponse } from "next/server";
import { demoUsers } from "@/lib/demo-data";

function createDemoToken(userId: string) {
  const payload = {
    userId,
    issuedAt: Date.now(),
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.username || !body?.password) {
    return NextResponse.json(
      { message: "Username and password are required" },
      { status: 400 },
    );
  }

  const user = demoUsers.find(
    (item) =>
      item.username === body.username &&
      item.password === body.password,
  );

  if (!user) {
    return NextResponse.json(
      { message: "Invalid username or password" },
      { status: 401 },
    );
  }

  return NextResponse.json({
    token: createDemoToken(user.id),
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
    },
  });
}
