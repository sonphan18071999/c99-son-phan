import { TOKEN_ICON_BASE_URL } from '../constants/token.constants'
import type { TokenOption } from '../types/token.types'

const bySymbol = (a: TokenOption, b: TokenOption): number =>
  a.symbol.localeCompare(b.symbol)

export const buildTokenOptions = (
  pricesByCurrency: Readonly<Record<string, number>>,
): TokenOption[] => {
  const options = Object.entries(pricesByCurrency)
    .filter(([, price]) => Number.isFinite(price) && price > 0)
    .map(([symbol, price]) => ({
      symbol,
      price,
      iconUrl: `${TOKEN_ICON_BASE_URL}/${symbol}.svg`,
    }))

  return options.sort(bySymbol)
}

export const formatCurrencyValue = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 6,
    minimumFractionDigits: 2,
  }).format(value)
}
