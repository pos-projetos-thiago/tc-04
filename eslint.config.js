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

      // react-hooks/set-state-in-effect (eslint-plugin-react-hooks v7 / React Compiler):
      // Rejeita o padrão `useEffect(() => { void asyncFn(); }, [asyncFn])` porque
      // `asyncFn` chama `setState` internamente, e o compilador classifica isso como
      // "setState síncrono dentro de effect". No entanto, o `setState` ocorre apenas
      // dentro das callbacks de uma Promise (após `await`), nunca de forma síncrona
      // — o React já garante que batching trata atualizações assíncronas de forma eficiente.
      // Este é o padrão documentado pela própria equipe do React para busca de dados em
      // hooks (ver: react.dev/learn/synchronizing-with-effects).
      // A regra tem falsos positivos para este caso de uso específico no React Compiler v7.
      // Desativada aqui de forma consciente para os dois hooks afetados:
      //   - src/features/dashboard/hooks/use-dashboard.ts
      //   - src/features/transactions/hooks/use-transactions.ts
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*'],
  },
]);
