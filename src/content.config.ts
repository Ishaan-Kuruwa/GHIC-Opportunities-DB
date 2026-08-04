import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Guide pages (Start Here, Free Learning Stack, How We Verify, About) live as
// plain Markdown in src/content/guides/ -- see CLAUDE.md's handoff constraint.
// A non-technical editor only ever needs to touch a .md file, never this schema.
const guides = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/guides" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const collections = { guides };
