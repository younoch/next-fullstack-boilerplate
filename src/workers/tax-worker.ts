// src/workers/tax-worker.ts
import { completeTaxTask, failTaxTask } from '@/features/tax-calculator/server/taxRepository';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { TaxFormInputs } from '@/features/tax-calculator/schemas/taxSchema';

type TaxWorkerMessage = {
  taskId: string;
  payload: TaxFormInputs;
};

export const taxWorkerHandler = async (content: TaxWorkerMessage) => {
  const { taskId, payload } = content;

  const key = `tax-job:${taskId}`;
  if (await redis.get(key)) {
    logger.info({ taskId }, 'Duplicate tax worker message, skipping');
    return;
  }

  logger.info({ taskId }, `📥 [Tax Worker] Processing Task ID: ${taskId}`);
  
  try {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const grossIncome = payload.grossIncome || 0;
    const totalDeductions = payload.totalDeductions || 0;
    const taxableIncome = grossIncome - totalDeductions;
    const taxDue = taxableIncome * 0.15;

    const calculationResult = {
      countryId: payload.countryId || 'BD',
      fiscalYear: payload.fiscalYear || '2026-2027',
      grossIncome,
      totalDeductions,
      taxableIncome,
      taxDue,
      metaData: { calculatedBy: 'Serverless-Worker-Polling-Engine' },
    };

    await completeTaxTask(taskId, calculationResult);
    logger.info({ taskId }, `💾 [Tax Worker] Task ${taskId} successfully updated in DB.`);

    await redis.set(key, '1', 'EX', 60 * 60 * 24);

  } catch (error: any) {
    logger.error({ err: error?.message, taskId }, `❌ [Tax Worker] Failed for Task ${taskId}`);
    await failTaxTask(taskId, error.message || 'Calculation error');
    throw error; 
  }
};

export default taxWorkerHandler;