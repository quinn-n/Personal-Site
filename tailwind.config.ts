import type { Config } from "tailwindcss";

type AddUtilitiesFn = (
  utilities: Record<string, Record<string, string>>,
) => void;

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      utilities: {},
    },
  },
  plugins: [
    ({ addUtilities }: { addUtilities: AddUtilitiesFn }) => {
      addUtilities({
        ".link-text": {
          color: "rgb(59 130 246)",
          "text-decoration": "underline",
        },
        ".border-box": {
          "box-sizing": "border-box",
        },
        ".justify-between": {
          "justify-content": "space-between",
        },
      });
    },
  ],
};
export default config;
