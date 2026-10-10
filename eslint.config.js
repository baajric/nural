// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // The Edge Function entrypoint is Deno code and is not part of the app bundle.
    ignores: ['dist/*', 'supabase/functions/**/index.ts'],
  },
]);
