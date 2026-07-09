import { NextResponse } from "next/server";
import { demoSongs } from "@/lib/demo-data";

export async function GET() {
  return NextResponse.json({
    songs: demoSongs,
  });
}
