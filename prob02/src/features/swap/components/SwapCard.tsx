import { Alert, Button, Card, Form, InputNumber, Space, Tooltip, Typography, message } from 'antd'
import { SwapOutlined, TableOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import { CurrencyPricesModal } from './CurrencyPricesModal'
import { fetchLatestPrices } from '../../pricing/api/pricing.api'
import { buildTokenOptions, formatCurrencyValue } from '../../tokens/utils/token.utils'
import { useSwapQuote } from '../hooks/useSwapQuote'
import { TokenSelect } from './TokenSelect'
import './SwapCard.scss'

const { Text } = Typography

const DEFAULT_AMOUNT = 1
const MIN_SWAP_AMOUNT = 0.000001
const MAX_SWAP_AMOUNT = 1_000_000_000
const MIN_SWAP_AMOUNT_LABEL = MIN_SWAP_AMOUNT.toString()

const isSafeAmount = (value: number | null): value is number => {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= MIN_SWAP_AMOUNT &&
    value <= MAX_SWAP_AMOUNT
  )
}

export const SwapCard = (): ReactElement => {
  const [amountFrom, setAmountFrom] = useState<number>(DEFAULT_AMOUNT)
  const [tokenFrom, setTokenFrom] = useState<string>('')
  const [tokenTo, setTokenTo] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [hasError, setHasError] = useState<boolean>(false)
  const [pricesByCurrency, setPricesByCurrency] = useState<Record<string, number>>({})
  const [isPricesModalOpen, setIsPricesModalOpen] = useState<boolean>(false)

  useEffect(() => {
    const loadPrices = async (): Promise<void> => {
      setIsLoading(true)
      setHasError(false)

      try {
        const prices = await fetchLatestPrices()
        setPricesByCurrency(prices)
      } catch {
        setHasError(true)
      } finally {
        setIsLoading(false)
      }
    }

    void loadPrices()
  }, [])

  const tokenOptions = useMemo(() => buildTokenOptions(pricesByCurrency), [pricesByCurrency])

  const resolvedTokenFrom = useMemo(() => {
    if (tokenFrom) {
      return tokenFrom
    }

    return tokenOptions[0]?.symbol ?? ''
  }, [tokenFrom, tokenOptions])

  const resolvedTokenTo = useMemo(() => {
    if (tokenTo) {
      return tokenTo
    }

    return tokenOptions.find((token) => token.symbol !== resolvedTokenFrom)?.symbol ?? ''
  }, [tokenTo, tokenOptions, resolvedTokenFrom])

  const amountTo = useSwapQuote({
    amountFrom,
    tokenFrom: resolvedTokenFrom,
    tokenTo: resolvedTokenTo,
    tokens: tokenOptions,
  })

  const isSubmitDisabled =
    isLoading ||
    hasError ||
    resolvedTokenFrom.length === 0 ||
    resolvedTokenTo.length === 0 ||
    resolvedTokenFrom === resolvedTokenTo ||
    amountFrom < MIN_SWAP_AMOUNT

  const handleSubmit = (): void => {
    message.success(
      `Swap request submitted: ${formatCurrencyValue(amountFrom)} ${resolvedTokenFrom} -> ${formatCurrencyValue(amountTo)} ${resolvedTokenTo}`,
    )
  }

  const handleSwapDirection = (): void => {
    if (!resolvedTokenFrom || !resolvedTokenTo) {
      return
    }

    setTokenFrom(resolvedTokenTo)
    setTokenTo(resolvedTokenFrom)
  }

  const pricesModalTrigger = (
    <Tooltip title="View currency prices">
      <Button
        icon={<TableOutlined />}
        type="text"
        size="small"
        className="swap-card__prices-button"
        onClick={() => setIsPricesModalOpen(true)}
        disabled={isLoading || hasError || tokenOptions.length === 0}
      />
    </Tooltip>
  )

  return (
    <>
      <CurrencyPricesModal
        open={isPricesModalOpen}
        onClose={() => setIsPricesModalOpen(false)}
        tokens={tokenOptions}
      />
      <Card className="swap-card" loading={isLoading} extra={pricesModalTrigger}>
      <Space orientation="vertical" size="large" className="swap-card__content">
        {hasError ? (
          <Alert
            type="error"
            showIcon
            title="Unable to fetch latest prices."
            description="Please refresh and try again."
          />
        ) : null}

        <Form layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="From"
            validateStatus={amountFrom < MIN_SWAP_AMOUNT ? 'error' : ''}
            help={
              amountFrom < MIN_SWAP_AMOUNT
                ? `Amount must be at least ${MIN_SWAP_AMOUNT_LABEL}.`
                : undefined
            }
          >
            <Space.Compact block>
              <InputNumber<number>
                value={amountFrom}
                onChange={(value) => {
                  setAmountFrom(isSafeAmount(value) ? value : 0)
                }}
                min={MIN_SWAP_AMOUNT}
                max={MAX_SWAP_AMOUNT}
                step={0.01}
                controls={false}
                placeholder="Enter amount"
                className="swap-card__amount-input"
              />
              <TokenSelect
                value={resolvedTokenFrom}
                onChange={setTokenFrom}
                options={tokenOptions}
                placeholder="Select token"
              />
            </Space.Compact>
          </Form.Item>

          <Button
            icon={<SwapOutlined />}
              type="primary"
            className="swap-card__swap-button"
            onClick={handleSwapDirection}
            disabled={!resolvedTokenFrom || !resolvedTokenTo}
          >
            Switch
          </Button>

          <Form.Item
            label="To"
            validateStatus={resolvedTokenFrom === resolvedTokenTo ? 'error' : ''}
            help={
              resolvedTokenFrom === resolvedTokenTo
                ? 'Source and target tokens must be different.'
                : undefined
            }
          >
            <Space.Compact block>
              <InputNumber<number>
                value={amountTo}
                controls={false}
                readOnly
                precision={6}
                className="swap-card__amount-input"
              />
              <TokenSelect
                value={resolvedTokenTo}
                onChange={setTokenTo}
                options={tokenOptions}
                placeholder="Select token"
              />
            </Space.Compact>
          </Form.Item>

          <div className="swap-card__rate">
            <Text type="secondary">
              1 {resolvedTokenFrom || '...'} ={' '}
              {amountFrom > 0 ? formatCurrencyValue(amountTo / amountFrom || 0) : '0'}{' '}
              {resolvedTokenTo || '...'}
            </Text>
          </div>

          {/* <Button type="primary" htmlType="submit" block disabled={isSubmitDisabled}>
            Swap Now
          </Button> */}
        </Form>
      </Space>
    </Card>
    </>
  )
}
