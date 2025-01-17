// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $api_message from "./routes/api/message.tsx";
import * as $create from "./routes/create.tsx";
import * as $index from "./routes/index.tsx";
import * as $join from "./routes/join.tsx";
import * as $room_roomId_ from "./routes/room/[roomId].tsx";
import * as $username from "./routes/username.tsx";
import * as $Counter from "./islands/Counter.tsx";
import { type Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.tsx": $_404,
    "./routes/_app.tsx": $_app,
    "./routes/api/message.tsx": $api_message,
    "./routes/create.tsx": $create,
    "./routes/index.tsx": $index,
    "./routes/join.tsx": $join,
    "./routes/room/[roomId].tsx": $room_roomId_,
    "./routes/username.tsx": $username,
  },
  islands: {
    "./islands/Counter.tsx": $Counter,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
