import axios from 'axios';
import { TaxFormInputs } from '../schemas/taxSchema';

// 🎯 টাইপ সেফটির জন্য এপিআই রেসপন্স ইন্টারফেসসমূহ
export interface TaxCalculationResponse {
  success: boolean;
  taskId?: string;
  message?: string;
  error?: string;
}

export interface TaxTaskStatusResponse {
  success: boolean;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: {
    taxableIncome: number;
    taxDue: number;
    metaData: {
      calculatedBy: string;
    };
  };
  message?: string;
  error?: string;
}

/**
 * 🚀 ব্যাকগ্রাউন্ড টাস্ক কিউতে ট্যাক্স হিসাবের রিকোয়েস্ট পাঠানোর সার্ভিস
 */
export const initiateTaxCalculation = async (data: TaxFormInputs): Promise<TaxCalculationResponse> => {
  // আপনার ব্যাকএন্ড এপিআই-এর রিকোয়ার্ড স্ট্রাকচার (payload অবজেক্ট) অনুযায়ী ডেটা ম্যাপ করা হলো
  const response = await axios.post<TaxCalculationResponse>('/api/tax/calculate', {
    payload: {
      grossIncome: data.grossIncome,
      totalDeductions: data.investments || 0, // ফর্মের investments-কে এখানে ব্যাকএন্ড পেলোডে পাঠানো হচ্ছে
      countryId: data.countryId,
      fiscalYear: data.fiscalYear,
    },
  });
  
  return response.data;
};

/**
 * 🔄 টাস্ক আইডি দিয়ে ব্যাকগ্রাউন্ড ক্যালকুলেশনের কারেন্ট স্ট্যাটাস চেক করার সার্ভিস (Polling Engine)
 */
export const checkTaxTaskStatus = async (taskId: string): Promise<TaxTaskStatusResponse> => {
  const response = await axios.get<TaxTaskStatusResponse>(`/api/tax/status/${taskId}`);
  return response.data;
};

export const fetchTaxBreakdown = async (calculationId: string) => {
  const response = await axios.get(`/api/tax/breakdown/${calculationId}`);
  return response.data;
}