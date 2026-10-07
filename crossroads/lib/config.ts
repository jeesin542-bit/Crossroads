// When true, the entire app runs off the canned example in lib/demo.ts and
// never calls the AI provider. Useful for demoing without an API key, or
// when you want a guaranteed-reliable walkthrough on stage.
export const DEMO_MODE: boolean = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
