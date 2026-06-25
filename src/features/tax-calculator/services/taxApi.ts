import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


export interface TaxCalculationPayload {
  countryId: string;
  fiscalYear: string;
  grossIncome: number;
  investments?: number;
}

export interface TaxTaskResponse {
  success: boolean;
  taskId?: string;      
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: {
    taxDue: string;
    [key: string]: any; 
  };
  error?: string | null;
}

export const initiateTaxCalculation = async (payload: TaxCalculationPayload): Promise<TaxTaskResponse> => {
  const response = await apiClient.post<TaxTaskResponse>('/tax/calculate', payload);
  return response.data;
};

export const checkTaxTaskStatus = async (taskId: string): Promise<TaxTaskResponse> => {
  const response = await apiClient.get<TaxTaskResponse>(`/tax/status/${taskId}`);
  return response.data;
};