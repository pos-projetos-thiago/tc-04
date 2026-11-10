import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/src/features/auth';
import { useColorScheme } from '@/src/shared/hooks/use-color-scheme';

import { transactionService } from '../services/firestore-transaction.service';
import type { Transaction } from '../types/transaction';
import { TransactionForm } from './transaction-form';

interface TransactionEditScreenProps {
  id?: string | string[];
}

type TransactionLoadState =
  | { key: string; status: 'loaded'; transaction: Transaction | null }
  | { key: string; status: 'error' };

export function TransactionEditScreen({ id }: TransactionEditScreenProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const transactionId = Array.isArray(id) ? id[0] : id;
  const userId = user?.id ?? null;
  const requestKey = userId && transactionId ? `${userId}:${transactionId}` : null;
  const [loadState, setLoadState] = useState<TransactionLoadState | null>(null);

  useEffect(() => {
    let active = true;
    if (!userId || !transactionId) return () => { active = false; };

    const key = `${userId}:${transactionId}`;
    transactionService
      .getById(transactionId, userId)
      .then((result) => {
        if (active) setLoadState({ key, status: 'loaded', transaction: result });
      })
      .catch(() => {
        if (active) setLoadState({ key, status: 'error' });
      });

    return () => {
      active = false;
    };
  }, [transactionId, userId]);

  const currentLoad = requestKey && loadState?.key === requestKey ? loadState : null;

  if (isAuthLoading || (requestKey !== null && currentLoad === null)) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  if (!requestKey || !currentLoad || currentLoad.status === 'error' || !currentLoad.transaction) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>
          {currentLoad?.status === 'error'
            ? 'Não foi possível carregar esta transação.'
            : 'Transação não encontrada ou sem acesso.'}
        </Text>
      </View>
    );
  }

  return (
    <TransactionForm key={currentLoad.transaction.id} initialData={currentLoad.transaction} />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
