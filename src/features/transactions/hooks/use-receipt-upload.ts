import { useCallback, useState } from 'react';

import type { SelectedAttachment } from '@/src/features/receipts/types/selected-attachment';
import { useTransactionContext } from './use-transaction-context';

interface UseReceiptUploadResult {
  /**
   * Faz o upload do arquivo e retorna a URL pública, ou null em caso de erro.
   * Aceita um SelectedAttachment (imagem, PDF ou TXT).
   */
  upload: (userId: string, transactionId: string, attachment: SelectedAttachment) => Promise<string | null>;
  /** Progresso do upload em % (0–100). Null enquanto não iniciado. */
  progress: number | null;
  isUploading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Encapsula o upload de anexo para o Firebase Storage.
 * Suporta imagens (JPEG, PNG), PDF e TXT.
 * Mantido independente do form para ser reutilizável em outros contextos.
 */
export function useReceiptUpload(): UseReceiptUploadResult {
  const { receiptService } = useTransactionContext();
  const [progress, setProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (
      userId: string,
      transactionId: string,
      attachment: SelectedAttachment,
    ): Promise<string | null> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        const url = await receiptService.upload(
          userId,
          transactionId,
          { uri: attachment.uri, name: attachment.name, mimeType: attachment.mimeType },
          (pct) => setProgress(pct),
        );
        return url;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Não foi possível enviar o anexo.';
        setError(message);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [receiptService],
  );

  const clearError = useCallback(() => setError(null), []);

  return { upload, progress, isUploading, error, clearError };
}
