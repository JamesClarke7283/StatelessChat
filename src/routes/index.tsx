import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { getCookies } from "https://deno.land/std@0.224.0/http/cookie.ts";
import { logger } from "../logging.ts";

interface Data {
  username: string;
}

export const handler: Handlers<Data> = {
  GET(req, ctx) {
    const cookies = getCookies(req.headers);
    const username = cookies.username;
    if (!username) {
      logger.info("Redirecting to username page due to missing username");
      return new Response("", {
        status: 303,
        headers: { Location: "/username" },
      });
    }
    logger.info(`Home page accessed by user: ${username}`);
    return ctx.render({ username: decodeURIComponent(username) });
  },
};

export default function Home({ data }: PageProps<Data>) {
  return (
    <>
      <Head>
        <title>StatelessChat</title>
      </Head>
      <div class="p-4 mx-auto max-w-screen-md">
        <h1 class="text-4xl font-bold text-center mb-6">Welcome to StatelessChat</h1>
        <p class="my-6 text-center">
          Hello, {data.username}! Chat privately and securely without any signup required.
        </p>
        <div class="flex justify-center space-x-4">
          <a href="/create" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">Create Room</a>
          <a href="/join" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">Join Room</a>
        </div>
      </div>
    </>
  );
}