// src/workers/tax-worker.ts
import { completeTaxTask, failTaxTask } from '../services/taxService';

export const taxWorkerHandler = async (content: any) => {
  const { taskId, payload } = content; // socketRoomId আর লাগছে না

  console.log(`📥 [Tax Worker] Processing Task ID: ${taskId}`);
  
  try {
    // 🧠 ভারী ট্যাক্স ক্যালকুলেশন লজিক (৩ সেকেন্ডের ফেক ডিলে)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const grossIncome = payload.grossIncome || 0;
    const totalDeductions = payload.totalDeductions || 0;
    const taxableIncome = grossIncome - totalDeductions;
    const taxDue = taxableIncome * 0.15;

    const calculationResult = {
      countryId: payload.countryId || "BD",
      fiscalYear: payload.fiscalYear || "2026-2027",
      grossIncome,
      totalDeductions,
      taxableIncome,
      taxDue,
      metaData: { calculatedBy: "Serverless-Worker-Polling-Engine" }
    };

    // ডাটাবেসে সেভ এবং স্ট্যাটাস COMPLETED করা
    await completeTaxTask(taskId, calculationResult);
    console.log(`💾 [Tax Worker] Task ${taskId} successfully updated in DB.`);

  } catch (error: any) {
    console.error(`❌ [Tax Worker] Failed for Task ${taskId}:`, error.message);
    // ডাটাবেজে স্ট্যাটাস FAILED করা
    await failTaxTask(taskId, error.message || 'Calculation error');
    throw error; 
  }
};

export default taxWorkerHandler;