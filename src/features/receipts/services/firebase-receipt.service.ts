import {
  deleteAttachment,
  uploadAttachment,
} from '@/src/lib/firebase/storage-service';

import type { IReceiptService, UploadFileInput } from '../types/receipt-service.interface';

class FirebaseReceiptService implements IReceiptService {
  upload(
    userId: string,
    transactionId: string,
    file: UploadFileInput,
    onProgress?: (progress: number) => void,
  ): Promise<string> {
    return uploadAttachment(userId, transactionId, file.uri, file.mimeType, onProgress);
  }

  delete(userId: string, transactionId: string, fileName: string): Promise<void> {
    return deleteAttachment(`receipts/${userId}/${transactionId}/${fileName}`);
  }
}

export const firebaseReceiptService: IReceiptService = new FirebaseReceiptService();
