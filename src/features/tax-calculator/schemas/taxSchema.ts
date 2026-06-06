import { z } from 'zod';

export const taxValidationSchema = z
  .object({
    countryId: z
      .string({ required_error: "অনুগ্রহ করে একটি দেশ সিলেক্ট করুন" })
      .min(2, { message: "দেশের কোডটি সঠিক নয়" }),

    fiscalYear: z
      .string({ required_error: "অর্থবছর নির্বাচন করা বাধ্যতামূলক" })
      .regex(/^\d{4}-\d{4}$/, { message: "ফরম্যাটটি অবশ্যই YYYY-YYYY হতে হবে" }),

    grossIncome: z
      .number({ 
        required_error: "মোট আয়ের পরিমাণ লিখুন",
        invalid_type_error: "আয়ের পরিমাণ অবশ্যই সংখ্যায় হতে হবে" 
      })
      .positive({ message: "আয়ের পরিমাণ অবশ্যই ০ থেকে বেশি হতে হবে" }),

    investments: z
      .number({ invalid_type_error: "বিনিয়োগের পরিমাণ সংখ্যায় হতে হবে" })
      .nonnegative({ message: "বিনিয়োগ কখনো নেগেティブ হতে পারে না" })
      .optional()
      .default(0),
  })
  // 💡 এখানে ক্রস-ফিল্ড ভ্যালিডেশন যোগ করা হলো 👇
  .refine((data) => (data.investments ?? 0) <= data.grossIncome, {
    message: "বিনিয়োগের পরিমাণ মোট আয়ের চেয়ে বেশি হতে পারে না",
    path: ["investments"], // এরর মেসেজটি সরাসরি investments ইনপুটের নিচে দেখাবে
  });

export type TaxFormInputs = z.input<typeof taxValidationSchema>;