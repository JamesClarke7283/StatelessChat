import { type PageProps } from "$fresh/server.ts";

export default function App({ Component }: PageProps) {
  return (
    <html lang="en" class="dark">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>StatelessChat</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body class="bg-gray-900 text-white">
        <main class="container mx-auto px-4 py-8">
          <Component />
        </main>
      </body>
    </html>
  );
}