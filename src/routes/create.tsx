import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { db } from "../database.ts";
import { getCookies, setCookie } from "https://deno.land/std@0.224.0/http/cookie.ts";
import { logger } from "../logging.ts";

interface Data {
  roomId?: string;
  password?: string;
  error?: string;
}

export const handler: Handlers<Data> = {
  GET(req, ctx) {
    logger.info("GET request received for create room page");
    const cookies = getCookies(req.headers);
    const username = cookies.username;
    if (!username) {
      logger.info("Redirecting to username page from create room page: No username found");
      return new Response("", {
        status: 303,
        headers: { Location: "/username" },
      });
    }
    logger.info(`Create room page accessed by user: ${username}`);
    return ctx.render({});
  },
  async POST(req, ctx) {
    logger.info("POST request received for create room page");
    const form = await req.formData();
    const password = form.get("password")?.toString();
    const cookies = getCookies(req.headers);
    const username = cookies.username;

    logger.debug(`Create room attempt - Username: ${username}, Password provided: ${password ? 'Yes' : 'No'}`);

    if (!username || !password) {
      logger.warn("Room creation attempt without username or password");
      return ctx.render({ error: "Username and password are required." });
    }

    const roomId = db.createRoom(password);
    logger.info(`Room created: ${roomId} by user: ${username}`);

    const token = await db.generateToken(username, roomId, password);
    logger.debug(`Token generated for room: ${roomId}`);

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
  },
};

export default function CreateRoom({ data }: PageProps<Data>) {
  logger.debug("Rendering CreateRoom component");
  return (
    <>
      <Head>
        <title>Create Room - StatelessChat</title>
      </Head>
      <div class="p-4 mx-auto max-w-screen-md">
        <h1 class="text-4xl font-bold mb-4 text-center">Create a New Room</h1>
        {data.error && <p class="text-red-500 text-center">{data.error}</p>}
        <form method="POST" class="flex flex-col items-center">
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
            Create Room
          </button>
        </form>
      </div>
    </>
  );
}