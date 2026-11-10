import { transactionService } from '@/src/features/transactions/services/firestore-transaction.service';

import { createDashboardService } from './dashboard.service';

// Composição da implementação Firebase com o serviço de dashboard.
export const dashboardService = createDashboardService(transactionService);
export const invalidateDashboard = dashboardService.invalidateDashboard;
