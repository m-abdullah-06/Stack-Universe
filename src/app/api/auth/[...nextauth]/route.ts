import { NextRequest } from "next/server"
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

function stripIss(req: NextRequest) {
  const url = new URL(req.url)
  if (url.pathname.includes("/callback/github") && url.searchParams.has("iss")) {
    url.searchParams.delete("iss")
    return new NextRequest(url, req)
  }
  return req
}

export async function GET(req: NextRequest, context: any) {
  return handler(stripIss(req), context)
}

export async function POST(req: NextRequest, context: any) {
  return handler(req, context)
}
