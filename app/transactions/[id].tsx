import { useLocalSearchParams } from 'expo-router';

import { TransactionEditScreen } from '@/src/features/transactions/components/transaction-edit-screen';

export default function EditTransactionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TransactionEditScreen id={id} />;
}
