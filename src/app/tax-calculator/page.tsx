// src/app/tax-calculator/page.tsx
'use client';

import { useState } from 'react';

export default function TaxCalculator() {
  const [loading, setLoading] = useState(false);
  const [taxResult, setTaxResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 🔄 প্রোডাকশন-গ্রেড পোলিং ফাংশন
  const pollTaskStatus = async (taskId: string, currentRetry = 0) => {
    const MAX_RETRIES = 15; // সর্বোচ্চ ১৫ বার চেক করবে (১৫ x ২ সেকেন্ড = ৩০ সেকেন্ড টাইমআউট)
    const POLLING_INTERVAL = 2000; // প্রতি ২ সেকেন্ড পর পর চেক করবে

    if (currentRetry >= MAX_RETRIES) {
      setError('ট্যাক্স হিসাব করতে অনেক সময় লাগছে। অনুগ্রহ করে একটু পর আপনার ড্যাশবোর্ড চেক করুন।');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/tax/status/${taskId}`);
      const data = await response.json();

      if (!data.success) {
        setError(data.message);
        setLoading(false);
        return;
      }

      if (data.status === 'COMPLETED') {
        setTaxResult(data.result);
        setLoading(false); // লোডিং শেষ
      } else if (data.status === 'FAILED') {
        setError(data.error || 'ক্যালকুলেশন ব্যর্থ হয়েছে।');
        setLoading(false);
      } else {
        // স্ট্যাটাস যদি এখনো PENDING বা PROCESSING থাকে, তবে ২ সেকেন্ড পর আবার রান হবে
        setTimeout(() => pollTaskStatus(taskId, currentRetry + 1), POLLING_INTERVAL);
      }
    } catch (err) {
      console.error('Polling error:', err);
      // নেটওয়ার্ক ড্রপ করলেও হাল না ছেড়ে পরের রিট্রাই করা
      setTimeout(() => pollTaskStatus(taskId, currentRetry + 1), POLLING_INTERVAL);
    }
  };

  const handleCalculateTax = async () => {
    try {
      setLoading(true);
      setError(null);
      setTaxResult(null);

      const response = await fetch('/api/tax/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: {
            grossIncome: 600000,
            totalDeductions: 75000,
            countryId: "BD",
            fiscalYear: "2026-2027"
          }
        }),
      });

      const data = await response.json();

      if (data.success && data.taskId) {
        console.log(`✉️ টাস্ক কিউতে ঢুকেছে। আইডি: ${data.taskId}, পোলিং শুরু হচ্ছে...`);
        // 🚀 পোলিং ইঞ্জিন স্টার্ট করা হলো
        pollTaskStatus(data.taskId);
      } else {
        setError(data.message || 'টাস্ক তৈরি করা যায়নি।');
        setLoading(false);
      }
    } catch (err) {
      setError('সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।');
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4 border mt-10">
      <h1 className="text-xl font-bold text-gray-800">Pacutax Cost-Effective Engine</h1>
      
      <button
        onClick={handleCalculateTax}
        disabled={loading}
        className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 disabled:bg-gray-400 font-medium"
      >
        {loading ? 'Hishab Hocche (Polling)...' : 'Calculate Tax'}
      </button>

      {loading && (
        <div className="text-amber-600 font-medium text-sm animate-pulse bg-amber-50 p-3 rounded border border-amber-200">
          🔄 ব্যাকগ্রাউন্ডে সিকিউরলি ট্যাক্স হিসাব হচ্ছে। পৃষ্ঠাটি রিফ্রেশ করবেন না...
        </div>
      )}

      {taxResult && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-bold text-green-800">হিসাব সম্পন্ন হয়েছে!</h3>
          <p className="text-sm text-gray-700 mt-2">Taxable Income: ৳{taxResult.taxableIncome}</p>
          <p className="text-base text-emerald-900 font-bold">Total Tax Due: ৳{taxResult.taxDue}</p>
          <div className="text-[10px] text-gray-400 mt-2 text-right">Engine: {taxResult.metaData.calculatedBy}</div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          ⚠️ এরর: {error}
        </div>
      )}
    </div>
  );
}