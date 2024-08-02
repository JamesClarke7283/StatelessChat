import { Handlers } from "$fresh/server.ts";
import { db } from "../../database.ts";
import { getCookies } from "https://deno.land/std@0.224.0/http/cookie.ts";

export const handler: Handlers = {
  async POST(req) {
    const { roomId, message } = await req.json();
    const cookies = getCookies(req.headers);
    const username = cookies.username || "Anonymous";
    const token = cookies.roomToken;

    if (!token || !(await db.validateToken(token, roomId))) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    await db.addMessage(roomId, username, message);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};