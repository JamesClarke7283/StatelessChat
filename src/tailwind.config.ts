import { type Config } from "tailwindcss";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'custom-purple': '#8A4D76', // You can adjust this hex code to your preferred shade of purple
      },
    },
  },
} satisfies Config;
