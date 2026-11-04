// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

// eslint-config-expo already bundles eslint-plugin-import.
// We only need to extend its rules — re-registering the plugin causes a conflict.
module.exports = defineConfig([
  expoConfig,
  {
    // ─── Regras de dependência entre camadas ─────────────────────────────────
    rules: {
      // import/no-restricted-paths: garante que camadas de apresentação não
      // importem diretamente da infraestrutura Firebase.
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            // app/ não pode importar de services/ nem de lib/firebase/
            {
              target: './app',
              from: './src/lib/firebase',
              message:
                'app/ não pode importar de src/lib/firebase/. Use um hook da feature correspondente.',
            },

            // shared/ não pode importar de nenhuma feature
            {
              target: './src/shared',
              from: './src/features',
              message:
                'src/shared/ não pode depender de nenhuma feature. Mova o código para shared/ ou crie uma abstração.',
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*'],
  },
]);
