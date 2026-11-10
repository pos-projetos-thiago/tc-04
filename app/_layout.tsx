// Polyfill carregado antes de qualquer outro módulo.
// Deve ser o primeiro import para garantir que AbortSignal.any esteja disponível
// antes de qualquer inicialização do Firebase AI Logic.
import '@/src/polyfills/abort-signal-any';

import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/src/shared/hooks/use-color-scheme';
import { AuthProvider } from '@/src/features/auth';
import { TransactionProvider } from '@/src/features/transactions';
import { AppSplashScreen } from '@/src/components/app-splash-screen';

// Impede que a splash screen nativa seja ocultada automaticamente.
// O controle de ocultação é feito manualmente após a renderização completa.
SplashScreen.preventAutoHideAsync();

// Configura o comportamento de fade-out da splash nativa antes de qualquer render.
SplashScreen.setOptions({
  duration: 300,
  fade: true,
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // Controla a exibição da splash screen customizada (React).
  // Permanece true enquanto o app ainda não terminou de inicializar.
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Aguarda dois frames para que a splash React seja pintada antes de
    // ocultar a tela nativa, sem impor um atraso artificial à inicialização.
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        setIsReady(true);
        void SplashScreen.hideAsync().catch((error: unknown) => {
          console.warn('Erro ao ocultar a splash screen:', error);
        });
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, []);

  // Enquanto não estiver pronto, exibe a splash customizada React
  // (fundo tema-aware + logo SVG), que substitui visualmente a nativa.
  if (!isReady) {
    return <AppSplashScreen />;
  }

  return (
    <AuthProvider>
      {/* TransactionProvider dentro do AuthProvider para que useAuth() resolva corretamente */}
      <TransactionProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="reset-password" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="transactions/new"
              options={{ title: 'Nova transação', presentation: 'modal' }}
            />
            <Stack.Screen
              name="transactions/[id]"
              options={{ title: 'Editar transação' }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </TransactionProvider>
    </AuthProvider>
  );
}
