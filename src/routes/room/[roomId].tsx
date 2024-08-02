import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { db } from "../../database.ts";
import { getCookies, setCookie } from "https://deno.land/std@0.224.0/http/cookie.ts";
import { logger } from "../../logging.ts";

interface Data {
  roomId: string;
  username: string;
  messages: { username: string; content: string; timestamp: number }[];
  error?: string;
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    const roomId = ctx.params.roomId;
    logger.info(`GET request received for room page: ${roomId}`);

    const url = new URL(req.url);
    const password = url.hash.slice(1); // Remove the '#' from the start
    logger.debug(`Password provided in URL: ${password ? 'Yes' : 'No'}`);

    const cookies = getCookies(req.headers);
    const username = cookies.username;
    if (!username) {
      logger.info(`Redirecting to username page from room ${roomId}: No username found`);
      return new Response("", {
        status: 303,
        headers: { Location: "/username" },
      });
    }

    let token = cookies.roomToken;
    logger.debug(`Token found in cookies: ${token ? 'Yes' : 'No'}`);

    if (!token && password) {
      logger.info(`Generating new token for user ${username} in room ${roomId}`);
      token = await db.generateToken(username, roomId, password);
      const headers = new Headers();
      setCookie(headers, {
        name: "roomToken",
        value: token,
        path: "/",
        sameSite: "Lax",
        maxAge: 3600, // 1 hour
      });
      logger.debug(`New token set in cookie for user ${username} in room ${roomId}`);
      return new Response("", {
        status: 303,
        headers: { ...headers, Location: `/room/${roomId}` },
      });
    }

    if (!token || !(await db.validateToken(token, roomId))) {
      logger.warn(`Invalid token for user ${username} in room ${roomId}`);
      return ctx.render({ roomId, username, messages: [], error: "Invalid room ID or password" });
    }

    const messages = await db.getMessages(roomId);
    logger.info(`User ${username} accessed room ${roomId}. Message count: ${messages.length}`);
    return ctx.render({ roomId, username, messages });
  },
};

export default function Room({ data }: PageProps<Data>) {
  logger.debug(`Rendering Room component for room: ${data.roomId}`);
  return (
    <>
      <Head>
        <title>Chat Room - StatelessChat</title>
      </Head>
      <div class="p-4 mx-auto max-w-screen-md">
        <h1 class="text-4xl font-bold mb-4 text-center">Chat Room: {data.roomId}</h1>
        {data.error ? (
          <p class="text-red-500 text-center">{data.error}</p>
        ) : (
          <>
            <div class="mb-4 h-64 overflow-y-auto border rounded p-2 bg-gray-800">
              {data.messages.map((msg, index) => (
                <div key={index} class="mb-2">
                  <strong>{msg.username}:</strong> {msg.content}
                </div>
              ))}
            </div>
            <form id="chatForm" class="flex">
              <input
                type="text"
                id="messageInput"
                placeholder="Type your message..."
                class="flex-grow p-2 border rounded-l bg-gray-700 text-white"
              />
              <button type="submit" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-r">
                Send
              </button>
            </form>
          </>
        )}
      </div>
      <script dangerouslySetInnerHTML={{__html: `
        const form = document.getElementById('chatForm');
        const input = document.getElementById('messageInput');
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const message = input.value.trim();
          if (message) {
            fetch('/api/message', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ roomId: '${data.roomId}', message })
            }).then(() => {
              input.value = '';
              location.reload();
            });
          }
        });
      `}} />
    </>
  );
}