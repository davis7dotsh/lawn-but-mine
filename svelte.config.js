import adapter from "@sveltejs/adapter-auto";

/** @type {import("@sveltejs/kit").Config} */
const config = {
  compilerOptions: {
    experimental: {
      async: true,
    },
  },
  extensions: [".svelte"],
  kit: {
    adapter: adapter(),
    alias: {
      "@": "./src",
      "@convex": "./convex",
    },
    experimental: {
      remoteFunctions: true,
    },
    prerender: {
      entries: [
        "/",
        "/compare/frameio",
        "/compare/wipster",
        "/for/video-editors",
        "/for/agencies",
        "/pricing",
      ],
    },
  },
};

export default config;
