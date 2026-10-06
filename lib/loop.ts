// The same 1–4 characters over and over, 100+ times, at the end of the model's output: a stuck
// model, not a contract (a line of underscores in a form is a few dozen at most).
export const LOOP = /(.{1,4})\1{100,}$/s;
