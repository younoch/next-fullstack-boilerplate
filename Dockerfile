FROM node:22-alpine

# Fedora/SELinux পারমিশন ইস্যু এড়াতে root ইউজার নিশ্চিত করা
USER root

WORKDIR /app

# ১. শুধুমাত্র প্যাকেজ ফাইল কপি
COPY package*.json ./

# ২. tsx গ্লোবালি ইন্সটল করুন (যাতে npx ছাড়াই সরাসরি tsx কমান্ড চলে)
RUN npm install && npm install -g tsx

# ৩. প্রিজমা জেনারেট করা
COPY prisma ./prisma/
RUN npx prisma generate

# ৪. সব কোড কপি করা
COPY . .

# প্রফেশনাল প্র্যাকটিস হিসেবে পারমিশন সেট করে দেওয়া
RUN chmod -R 777 /app

CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]