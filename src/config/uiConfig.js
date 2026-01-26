// NOTE: Do not import tailwind.config.js at runtime in the browser
// — it uses CommonJS (`module.exports`) and will throw "module is not defined".
// Keep the breakpoint value in sync with tailwind.config.js manually,
// or generate this file at build-time if you prefer automation.

export const mdBreakpoint = '1200px';
export const mdMediaQuery = `(max-width: ${mdBreakpoint})`;
