// src/app/tax-calculator/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taxValidationSchema, type TaxFormInputs } from '@/features/tax-calculator/schemas/taxSchema';
import { initiateTaxCalculation, checkTaxTaskStatus, fetchTaxBreakdown } from '@/features/tax-calculator/services/taxApi';

export default function TaxCalculator() {
  const [loading, setLoading] = useState(false);
  const [taxResult, setTaxResult] = useState<{ taxableIncome: number; taxDue: number } | null>(null);
  const [breakdown, setBreakdown] = useState<{ details: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 🛠️ React Hook Form সেটআপ (Zod স্কিমার সাথে সিঙ্কড)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaxFormInputs>({
    resolver: zodResolver(taxValidationSchema),
    defaultValues: {
      countryId: 'BD',
      fiscalYear: '2026-2027',
      grossIncome: undefined,
      investments: 0,
    },
  });

  // 🔄 প্রোডাকশন-গ্রেড পোলিং engine (Polling Engine)
  const pollTaskStatus = async (taskId: string, currentRetry = 0) => {
    const MAX_RETRIES = 15; // সর্বোচ্চ ১৫ বার চেক করবে (১৫ x ২ সেকেন্ড = ৩০ সেকেন্ড)
    const POLLING_INTERVAL = 2000; 

    if (currentRetry >= MAX_RETRIES) {
      setError('ট্যাক্স হিসাব করতে অনেক সময় লাগছে। অনুগ্রহ করে একটু পর আবার চেষ্টা করুন।');
      setLoading(false);
      return;
    }

    try {
      const data = await checkTaxTaskStatus(taskId);

      if (!data.success) {
        setError(data.error || 'টাস্ক স্ট্যাটাস চেক করতে সমস্যা হয়েছে।');
        setLoading(false);
        return;
      }

      if (data.status === 'COMPLETED') {
        setTaxResult(data.result);
        
        // এখন getTaxCalculation API দিয়ে বিস্তারিত breakdown ফেচ করবো
        if (data.result?.calculationId) {
          try {
            const breakdownData = await fetchTaxBreakdown(data.result.calculationId);
            if (breakdownData.success) {
              setBreakdown(breakdownData.result);
            }
          } catch (breakdownErr) {
            console.error('Error fetching breakdown:', breakdownErr);
            // breakdown fetch করা ব্যর্থ হলেও result display করব
          }
        }
        
        setLoading(false);
      } else if (data.status === 'FAILED') {
        setError(data.error || 'ক্যালকুলেশন ব্যর্থ হয়েছে।');
        setLoading(false);
      } else {
        // স্ট্যাটাস PENDING বা PROCESSING হলে আবার ২ সেকেন্ড পর রান হবে
        setTimeout(() => pollTaskStatus(taskId, currentRetry + 1), POLLING_INTERVAL);
      }
    } catch (err: any) {
      console.error('Polling error:', err);
      // নেটওয়ার্ক সাময়িক ড্রপ করলেও পোলিং সচল রাখবে
      setTimeout(() => pollTaskStatus(taskId, currentRetry + 1), POLLING_INTERVAL);
    }
  };

  // 🚀 সাবমিট হ্যান্ডলার (ইউজার ইনপুট ডেটা এখানে `formData` হিসেবে আসবে)
  const onSubmit = async (formData: TaxFormInputs) => {
    try {
      setLoading(true);
      setError(null);
      setTaxResult(null);
      setBreakdown(null);

      // ফর্ম থেকে আসা রিয়েল ডেটা অবজেক্টটি এপিআই-তে পাঠানো হচ্ছে
      const response = await initiateTaxCalculation(formData);

      if (response.success && response.taskId) {
        // টাস্ক কিউতে সাকসেসফুলি ঢুকেছে, এবার পোলিং শুরু করা যাক
        pollTaskStatus(response.taskId);
      } else {
        setError(response.error || 'টাস্ক তৈরি করা যায়নি।');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('API Error:', err);
      setError(err.response?.data?.message || 'সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।');
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md space-y-6 border mt-10">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Pacutax Cost-Effective Engine</h1>
        <p className="text-xs text-gray-500 mt-1">সঠিক তথ্য দিয়ে আপনার ট্যাক্স হিসাব করুন</p>
      </div>

      {/* 📥 ইউজার ইনপুট ফর্ম */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        {/* দেশ সিলেকশন */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">দেশ নির্বাচন করুন</label>
          <select
            {...register('countryId')}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="BD">Bangladesh (BD)</option>
            <option value="IN">India (IN)</option>
            <option value="US">United States (US)</option>
          </select>
          {errors.countryId && <p className="text-xs text-red-500 mt-1">{errors.countryId.message}</p>}
        </div>

        {/* অর্থবছর */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">অর্থবছর (Fiscal Year)</label>
          <input
            type="text"
            placeholder="YYYY-YYYY (উদা: 2026-2027)"
            {...register('fiscalYear')}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {errors.fiscalYear && <p className="text-xs text-red-500 mt-1">{errors.fiscalYear.message}</p>}
        </div>

        {/* মোট বার্ষিক আয় */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">মোট বার্ষিক আয় (Gross Income)</label>
          <input
            type="number"
            placeholder="৳০.০০"
            {...register('grossIncome', { valueAsNumber: true })}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {errors.grossIncome && <p className="text-xs text-red-500 mt-1">{errors.grossIncome.message}</p>}
        </div>

        {/* বিনিয়োগ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">মোট বিনিয়োগ / রেয়াতযোগ্য তহবিল (ঐচ্ছিক)</label>
          <input
            type="number"
            placeholder="৳০.০০"
            {...register('investments', { valueAsNumber: true })}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {errors.investments && <p className="text-xs text-red-500 mt-1">{errors.investments.message}</p>}
        </div>

        {/* সাবমিট বাটন */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 disabled:bg-gray-400 font-medium transition-colors text-sm"
        >
          {loading ? 'হিসাব হচ্ছে (Polling)...' : 'Calculate Tax'}
        </button>
      </form>

      {/* 🔄 পোলিং বা লোডিং ইন্ডিকেটর */}
      {loading && (
        <div className="text-amber-600 font-medium text-xs animate-pulse bg-amber-50 p-3 rounded border border-amber-200">
          🔄 ব্যাকগ্রাউন্ডে সিকিউরলি ট্যাক্স হিসাব হচ্ছে। পৃষ্ঠাটি রিফ্রেশ করবেন না।
        </div>
      )}

      {/* 🎉 সফল হিসাবের রেজাল্ট কার্ড + বিস্তারিত ব্রেকডাউন */}
      {taxResult && (
        <div className="space-y-6">
          {/* সামারি সেকশন */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-3">
            <h3 className="font-bold text-green-800 text-sm">✅ হিসাব সম্পন্ন হয়েছে!</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-2 rounded border border-green-100">
                <p className="text-xs text-gray-600">মোট আয়</p>
                <p className="text-lg font-semibold text-gray-800">৳{taxResult.grossIncome?.toLocaleString('bn-BD') ?? 0}</p>
              </div>
              
              <div className="bg-white p-2 rounded border border-green-100">
                <p className="text-xs text-gray-600">কর্তন</p>
                <p className="text-lg font-semibold text-gray-800">৳{taxResult.totalDeductions?.toLocaleString('bn-BD') ?? 0}</p>
              </div>
              
              <div className="bg-white p-2 rounded border border-green-100">
                <p className="text-xs text-gray-600">করযোগ্য আয়</p>
                <p className="text-lg font-semibold text-gray-800">৳{taxResult.taxableIncome?.toLocaleString('bn-BD') ?? 0}</p>
              </div>
              
              <div className="bg-emerald-100 p-2 rounded border border-emerald-300">
                <p className="text-xs text-emerald-700 font-semibold">মোট প্রদেয় ট্যাক্স</p>
                <p className="text-lg font-bold text-emerald-900">৳{taxResult.taxDue?.toLocaleString('bn-BD')}</p>
              </div>
            </div>

            {taxResult.metaData?.calculatedBy && (
              <div className="text-[10px] text-gray-400 text-right">
                Engine: {taxResult.metaData.calculatedBy}
              </div>
            )}
          </div>

          {/* বিস্তারিত ব্রেকডাউন সেকশন */}
          {breakdown && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 text-sm border-b pb-2">📊 বিস্তারিত ব্রেকডাউন</h3>

              {/* ট্যাক্স স্ল্যাব টেবিল */}
              {breakdown.breakdown?.slabs && breakdown.breakdown.slabs.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">💰 ট্যাক্স স্ল্যাব:</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-2 text-left">আয়ের রেঞ্জ</th>
                          <th className="border p-2 text-center">হার</th>
                          <th className="border p-2 text-right">ট্যাক্স</th>
                        </tr>
                      </thead>
                      <tbody>
                        {breakdown.breakdown.slabs.map((slab: any, i: number) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="border p-2">
                              ৳{slab.min.toLocaleString('bn-BD')} - ৳{slab.max === Infinity ? '∞' : slab.max.toLocaleString('bn-BD')}
                            </td>
                            <td className="border p-2 text-center">{(slab.rate * 100).toFixed(1)}%</td>
                            <td className="border p-2 text-right font-semibold">৳{slab.tax.toLocaleString('bn-BD', { maximumFractionDigits: 0 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* এক্সেম্পশন সেকশন */}
              {breakdown.breakdown?.exemptions && breakdown.breakdown.exemptions.length > 0 && (
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-xs font-semibold text-blue-800 mb-2">🏛️ ছাড় (Exemptions):</p>
                  <ul className="space-y-1">
                    {breakdown.breakdown.exemptions.map((exemption: any, i: number) => (
                      <li key={i} className="flex justify-between text-xs">
                        <span className="text-blue-700">{exemption.name}</span>
                        <span className="font-semibold text-blue-900">৳{exemption.amount.toLocaleString('bn-BD')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ডিডাকশন সেকশন */}
              {breakdown.breakdown?.deductions && breakdown.breakdown.deductions.length > 0 && (
                <div className="bg-purple-50 p-3 rounded border border-purple-200">
                  <p className="text-xs font-semibold text-purple-800 mb-2">📋 অনুমোদিত কর্তন:</p>
                  <ul className="space-y-1">
                    {breakdown.breakdown.deductions.map((deduction: any, i: number) => (
                      <li key={i} className="flex justify-between text-xs">
                        <span className="text-purple-700">{deduction.name}</span>
                        <span className="font-semibold text-purple-900">৳{deduction.amount.toLocaleString('bn-BD')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* মেটাডেটা */}
              {breakdown.metaData && (
                <div className="text-[10px] text-gray-500 p-2 bg-gray-50 rounded">
                  <p>🔧 Engine: {breakdown.metaData.calculatedBy}</p>
                  <p>📅 Calculated: {new Date(breakdown.metaData.calculatedAt).toLocaleString('bn-BD')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ⚠️ এরর মেসেজ */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
          ⚠️ এরর: {error}
        </div>
      )}
    </div>
  );
}
