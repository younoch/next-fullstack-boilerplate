// src/features/tax-calculator/server/taxRepository.ts
import prisma from '@/lib/prisma';
import { TaxFormInputs } from '../schemas/taxSchema';
import { TaskStatus, Prisma } from '@prisma/client';

function parseFiscalYear(value: string | number): number {
  if (typeof value === 'number') return value;
  const match = String(value).match(/\d{4}/);
  return match ? parseInt(match[0], 10) : new Date().getFullYear();
}

async function resolveCountryId(
  countryCodeOrId: string,
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
): Promise<string> {
  const byCode = await tx.country.findUnique({ where: { code: countryCodeOrId } });
  if (byCode) return byCode.id;

  const byId = await tx.country.findUnique({ where: { id: countryCodeOrId } });
  if (byId) return byId.id;

  const created = await tx.country.create({
    data: { code: countryCodeOrId, name: countryCodeOrId },
  });
  return created.id;
}

export const createTaxTask = async (payload: TaxFormInputs, socketRoomId?: string) => {
  return await prisma.taxTask.create({
    data: {
      status: TaskStatus.PENDING,
      payload: payload as unknown as Prisma.InputJsonValue,
      socketRoomId,
    },
  });
};

export const completeTaxTask = async (
  taskId: string,
  calculationData: {
    countryId: string;
    fiscalYear: string | number;
    grossIncome: number | Prisma.Decimal;
    totalDeductions: number | Prisma.Decimal;
    taxableIncome: number | Prisma.Decimal;
    taxDue: number | Prisma.Decimal;
    metaData?: any;
  }
) => {
  return await prisma.$transaction(async (tx) => {
    const countryId = await resolveCountryId(calculationData.countryId, tx);

    const calculation = await tx.taxCalculation.create({
      data: {
        countryId,
        fiscalYear: parseFiscalYear(calculationData.fiscalYear),
        grossIncome: calculationData.grossIncome,
        totalDeductions: calculationData.totalDeductions,
        taxableIncome: calculationData.taxableIncome,
        taxDue: calculationData.taxDue,
        metaData: calculationData.metaData,
      },
    });

    return await tx.taxTask.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.COMPLETED,
        calculationId: calculation.id,
        result: {
          grossIncome: calculationData.grossIncome.toString(),
          totalDeductions: calculationData.totalDeductions.toString(),
          taxableIncome: calculationData.taxableIncome.toString(),
          taxDue: calculationData.taxDue.toString(),
          metaData: calculationData.metaData ?? null,
        } as Prisma.InputJsonValue,
      },
    });
  });
};

export const failTaxTask = async (taskId: string, errorMessage: string) => {
  return await prisma.taxTask.update({
    where: { id: taskId },
    data: {
      status: TaskStatus.FAILED,
      errorMessage,
    },
  });
};

export const getTaxTask = async (taskId: string) => {
  return await prisma.taxTask.findUnique({
    where: { id: taskId },
    select: {
      status: true,
      result: true,
      errorMessage: true,
    },
  });
};

export const listTaxTasks = async (skip: number, take: number) => {
  return await prisma.taxTask.findMany({
    skip,
    take,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      createdAt: true,
    },
  });
};

export const getTaxCalculation = async (calculationId: string) => {
  return await prisma.taxCalculation.findUnique({
    where: { id: calculationId },
    include: {
      country: {
        select: { code: true, name: true },
      },
    },
  });
}
