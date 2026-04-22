import type { PriceMap, PriceRecord } from '../types/pricing.types'
import { CURRENCIES } from '../../tokens/constants/currencies'

const isValidIsoDate = (value: string): boolean => {
  const parsedDate = Date.parse(value)
  return Number.isFinite(parsedDate)
}

const normalizePriceRecord = (value: unknown): PriceRecord | null => {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const draft = value as Partial<Record<keyof PriceRecord, unknown>>
  if (
    typeof draft.currency !== 'string' ||
    typeof draft.date !== 'string' ||
    typeof draft.price !== 'number'
  ) {
    return null
  }

  if (!isValidIsoDate(draft.date) || draft.price <= 0) {
    return null
  }

  return {
    currency: draft.currency.trim(),
    date: draft.date,
    price: draft.price,
  }
}

const buildPriceMap = (records: unknown[]): PriceMap => {
  const latestByCurrency = new Map<string, PriceRecord>()

  for (const item of records) {
    const normalized = normalizePriceRecord(item)
    if (!normalized) {
      continue
    }

    const existing = latestByCurrency.get(normalized.currency)
    if (!existing || Date.parse(normalized.date) >= Date.parse(existing.date)) {
      latestByCurrency.set(normalized.currency, normalized)
    }
  }

  const prices: PriceMap = {}
  for (const [currency, record] of latestByCurrency.entries()) {
    prices[currency] = record.price
  }

  return prices
}

export const fetchLatestPrices = async (): Promise<PriceMap> => {
  return buildPriceMap(CURRENCIES)
}
