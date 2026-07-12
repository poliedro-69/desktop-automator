// Single source of truth for the app version.
// Imported from package.json at build time by Vite.
import pkg from "../package.json";

export const APP_VERSION = pkg.version;
