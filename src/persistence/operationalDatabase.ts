// Metro selects platform files in production. This base export keeps TypeScript's
// non-platform resolver aware of the native contract used by the current app.
export * from './operationalDatabase.native';
