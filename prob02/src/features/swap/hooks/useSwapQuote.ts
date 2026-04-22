import { useMemo } from 'react'
import type { TokenOption } from '../../tokens/types/token.types'

interface UseSwapQuoteParams {
  readonly amountFrom: number
  readonly tokenFrom: string
  readonly tokenTo: string
  readonly tokens: TokenOption[]
}

export const useSwapQuote = ({
  amountFrom,
  tokenFrom,
  tokenTo,
  tokens,
}: UseSwapQuoteParams): number => {
  return useMemo(() => {
    const fromToken = tokens.find((token) => token.symbol === tokenFrom)
    const toToken = tokens.find((token) => token.symbol === tokenTo)

    if (!fromToken || !toToken || amountFrom <= 0) {
      return 0
    }

    const usdValue = amountFrom * fromToken.price
    return usdValue / toToken.price
  }, [amountFrom, tokenFrom, tokenTo, tokens])
}
