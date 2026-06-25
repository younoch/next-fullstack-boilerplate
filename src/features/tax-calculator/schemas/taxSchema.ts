import { z } from 'zod';

export const taxValidationSchema = z.object({
  // ১. দেশের আইডি (যেমন: "BD") - কমপক্ষে ২ অক্ষরের হতে হবে
  countryId: z
    .string({ required_error: "অনুগ্রহ করে একটি দেশ সিলেক্ট করুন" })
    .min(2, { message: "দেশের কোডটি সঠিক নয়" }),

  // ২. অর্থবছর (যেমন: "2026-2027") - রেগুলার এক্সপ্রেশন দিয়ে ফরম্যাট চেক
  fiscalYear: z
    .string({ required_error: "অর্থবছর নির্বাচন করা বাধ্যতামূলক" })
    .regex(/^\d{4}-\d{4}$/, { message: "ফরম্যাটটি অবশ্যই YYYY-YYYY হতে হবে (উদা: 2026-2027)" }),

  // ৩. মোট আয় (Gross Income) - অবশ্যই পজিটিভ সংখ্যা হতে হবে
  grossIncome: z
    .number({ 
      required_error: "মোট আয়ের পরিমাণ লিখুন",
      invalid_type_error: "আয়ের পরিমাণ অবশ্যই সংখ্যায় হতে হবে" 
    })
    .positive({ message: "আয়ের পরিমাণ অবশ্যই ০ থেকে বেশি হতে হবে" }),

  // ৪. বিনিয়োগ (Investments) - এটি অপশনাল, তবে দিলে নেগেটিভ হওয়া যাবে না
  investments: z
    .number({ invalid_type_error: "বিনিয়োগের পরিমাণ সংখ্যায় হতে হবে" })
    .nonnegative({ message: "বিনিয়োগ কখনো নেগেটিভ হতে পারে না" })
    .optional()
    .default(0),
});

// 💡 Zod স্কিমা থেকেই সরাসরি টাইপস্ক্রিপ্ট টাইপ জেনারেট করা (Axios-এ ব্যবহারের জন্য)
export type TaxFormInputs = z.infer<typeof taxValidationSchema>;