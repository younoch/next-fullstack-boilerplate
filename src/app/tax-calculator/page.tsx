'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taxValidationSchema, type TaxFormInputs } from '@/features/tax-calculator/schemas/taxSchema';
import { initiateTaxCalculation, checkTaxTaskStatus } from '@/features/tax-calculator/services/taxApi';

export default function TaxCalculator() {
  const [loading, setLoading] = useState(false);
  const [taxResult, setTaxResult] = useState<any>(null);
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

  // 🔄 প্রোডাকশন-গ্রেড পোলিং ইঞ্জিন (Axios সার্ভিস দিয়ে কানেক্টেড)
  const pollTaskStatus = async (taskId: string, currentRetry = 0) => {
    const MAX_RETRIES = 15; // সর্বোচ্চ ১৫ বার চেক করবে (১৫ x ২ সেকেন্ড = ৩০ সেকেন্ড)
    const POLLING_INTERVAL = 2000; 

    if (currentRetry >= MAX_RETRIES) {
      setError('ট্যাক্স হিসাব করতে অনেক সময় লাগছে। অনুগ্রহ করে একটু পর আবার চেষ্টা করুন।');
      setLoading(false);
      return;
    }

    try {
      // আমাদের এক্সিওস সার্ভিস কল হচ্ছে
      const data = await checkTaxTaskStatus(taskId);

      if (!data.success) {
        setError(data.error || 'টাস্ক স্ট্যাটাস চেক করতে সমস্যা হয়েছে।');
        setLoading(false);
        return;
      }

      if (data.status === 'COMPLETED') {
        setTaxResult(data.result);
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
      // নেটওয়ার্ক ড্রপ করলেও পোলিং সচল থাকবে
      setTimeout(() => pollTaskStatus(taskId, currentRetry + 1), POLLING_INTERVAL);
    }
  };

  // 🚀 সাবমিট হ্যান্ডলার (ইউজার ইনপুট ডেটা এখানে `formData` হিসেবে আসবে)
  const onSubmit = async (formData: TaxFormInputs) => {
    try {
      setLoading(true);
      setError(null);
      setTaxResult(null);

      // হার্ডকোডেড অবজেক্টের বদলে সরাসরি ইউজারের ইনপুট করা ডেটা এপিআই-তে পাঠানো হচ্ছে
      const response = await initiateTaxCalculation(formData);

      if (response.success && response.taskId) {
        // task queued, start polling
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
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-6 border mt-10">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Pacutax Cost-Effective Engine</h1>
        <p className="text-xs text-gray-500 mt-1">সঠিক তথ্য দিয়ে আপনার ট্যাক্স হিসাব করুন</p>
      </div>

      {/* 📥 ইউজার ইনপুট ফর্ম (React Hook Form এর handleSubmit দিয়ে র‍্যাপ করা) */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        {/* দেশ সিলেকশন */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">দেশ নির্বাচন করুন</label>
          <select
            {...register('countryId')}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

        {/* মোট বার্ষিক আয় */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">মোট বার্ষিক আয় (Gross Income)</label>
          <input
            type="number"
            placeholder="৳০.০০"
            {...register('grossIncome', { valueAsNumber: true })}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {errors.grossIncome && <p className="text-xs text-red-500 mt-1">{errors.grossIncome.message}</p>}
        </div>

        {/* বিনিয়োগ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">মোট বিনিয়োগ / রেয়াতযোগ্য তহবিল (ঐচ্ছিক)</label>
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
          🔄 ব্যাকগ্রাউন্ডে সিকিউরলি ট্যাক্স হিসাব হচ্ছে। পৃষ্ঠাটি রিফ্রেশ করবেন না...
        </div>
      )}

      {/* 🎉 সফল হিসাবের রেজাল্ট কার্ড */}
      {taxResult && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-2">
          <h3 className="font-bold text-green-800 text-sm">হিসাব সম্পন্ন হয়েছে!</h3>
          <div className="text-sm text-gray-700 space-y-1">
            <p>ট্যাক্সযোগ্য আয়: <span className="font-semibold">৳{taxResult.taxableIncome ?? 0}</span></p>
            <p className="text-base text-emerald-900 font-bold">মোট প্রদেয় ট্যাক্স: ৳{taxResult.taxDue}</p>
          </div>
          {taxResult.metaData?.calculatedBy && (
            <div className="text-[10px] text-gray-400 mt-2 text-right">Engine: {taxResult.metaData.calculatedBy}</div>
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