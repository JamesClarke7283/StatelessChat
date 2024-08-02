import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { db } from "../database.ts";
import { getCookies, setCookie } from "https://deno.land/std@0.224.0/http/cookie.ts";
import { logger } from "../logging.ts";

interface Data {
  error?: string;
}

export const handler: Handlers<Data> = {
  GET(req, ctx) {
    logger.info("GET request received for join room page");
    const cookies = getCookies(req.headers);
    const username = cookies.username;
    if (!username) {
      logger.info("Redirecting to username page from join room page: No username found");
      return new Response("", {
        status: 303,
        headers: { Location: "/username" },
      });
    }
    logger.info(`Join room page accessed by user: ${username}`);
    return ctx.render({});
  },
  async POST(req, ctx) {
    logger.info("POST request received for join room page");
    const form = await req.formData();
    const cookies = getCookies(req.headers);
    const username = cookies.username;
    const roomId = form.get("roomId")?.toString();
    const password = form.get("password")?.toString();

    logger.debug(`Join room attempt - Username: ${username}, RoomID: ${roomId}, Password provided: ${password ? 'Yes' : 'No'}`);

    if (!username || !roomId || !password) {
      logger.warn("Room join attempt with missing information");
      return ctx.render({ error: "All fields are required." });
    }

    if (db.joinRoom(roomId, password, username)) {
      logger.info(`User ${username} successfully joined room: ${roomId}`);
      const token = await db.generateToken(username, roomId, password);
      logger.debug(`Token generated for user ${username} in room ${roomId}`);
      const headers = new Headers();
      setCookie(headers, {
        name: "roomToken",
        value: token,
        path: "/",
        sameSite: "Lax",
        maxAge: 3600, // 1 hour
      });
      logger.info(`Redirecting user ${username} to room ${roomId}`);
      return new Response("", {
        status: 303,
        headers: { ...headers, Location: `/room/${roomId}` },
      });
    } else {
      logger.warn(`Failed join attempt for room ${roomId} by user ${username}`);
      return ctx.render({ error: "Invalid room ID or password." });
    }
  },
};

export default function JoinRoom({ data }: PageProps<Data>) {
  logger.debug("Rendering JoinRoom component");
  return (
    <>
      <Head>
        <title>Join Room - StatelessChat</title>
      </Head>
      <div class="p-4 mx-auto max-w-screen-md">
        <h1 class="text-4xl font-bold mb-4 text-center">Join a Room</h1>
        {data.error && <p class="text-red-500 text-center">{data.error}</p>}
        <form method="POST" class="flex flex-col items-center">
          <div class="mb-4 w-full max-w-xs">
            <label for="roomId" class="block mb-2">Room ID:</label>
            <input
              type="text"
              id="roomId"
              name="roomId"
              required
              class="w-full p-2 border rounded bg-gray-700 text-white"
            />
          </div>
          <div class="mb-4 w-full max-w-xs">
            <label for="password" class="block mb-2">Room Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              class="w-full p-2 border rounded bg-gray-700 text-white"
            />
          </div>
          <button type="submit" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
            Join Room
          </button>
        </form>
      </div>
    </>
  );
}