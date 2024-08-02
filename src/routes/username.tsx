import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { setCookie } from "https://deno.land/std@0.224.0/http/cookie.ts";
import { logger } from "../logging.ts";

interface Data {
  error?: string;
}

export const handler: Handlers<Data> = {
  GET(_, ctx) {
    logger.info("Accessing username page");
    return ctx.render({});
  },
  async POST(req, ctx) {
    const form = await req.formData();
    const username = form.get("username")?.toString();

    if (!username) {
      logger.warn("Username submission attempt without a username");
      return ctx.render({ error: "Username is required." });
    }

    const headers = new Headers();
    setCookie(headers, {
      name: "username",
      value: encodeURIComponent(username),
      path: "/",
      sameSite: "Lax",
      maxAge: 3600, // 1 hour
    });

    logger.info(`Username set: ${username}`);
    return new Response("", {
      status: 303,
      headers: { ...headers, Location: "/" },
    });
  },
};

export default function Username({ data }: PageProps<Data>) {
  return (
    <>
      <Head>
        <title>Set Username - StatelessChat</title>
      </Head>
      <div class="p-4 mx-auto max-w-screen-md">
        <h1 class="text-4xl font-bold mb-4 text-center">Welcome to StatelessChat</h1>
        <p class="mb-4 text-center">Please enter a username to continue.</p>
        {data.error && <p class="text-red-500 text-center">{data.error}</p>}
        <form method="POST" class="flex flex-col items-center">
          <input
            type="text"
            id="username"
            name="username"
            placeholder="Enter your username"
            required
            class="w-full max-w-xs p-2 mb-4 border rounded bg-gray-700 text-white"
          />
          <button type="submit" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
            Set Username
          </button>
        </form>
      </div>
    </>
  );
}