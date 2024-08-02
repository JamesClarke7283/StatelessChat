import { Handlers } from "$fresh/server.ts";
import { db } from "../../database.ts";
import { getCookies } from "https://deno.land/std@0.224.0/http/cookie.ts";
import { logger } from "../../logging.ts";

export const handler: Handlers = {
  async POST(req) {
    logger.info("POST request received for message API");
    const { roomId, message } = await req.json();
    const cookies = getCookies(req.headers);
    const username = cookies.username || "Anonymous";
    const token = cookies.roomToken;

    logger.debug(`Message post attempt - Username: ${username}, RoomID: ${roomId}, Token present: ${token ? 'Yes' : 'No'}`);

    if (!token || !(await db.validateToken(token, roomId))) {
      logger.warn(`Invalid token for user ${username} in room ${roomId}`);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    await db.addMessage(roomId, username, message);
    logger.info(`Message added to room ${roomId} by user ${username}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};