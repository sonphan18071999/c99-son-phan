import { Avatar, Select, Space, Typography } from 'antd'
import type { ReactElement } from 'react'
import type { TokenOption } from '../../tokens/types/token.types'

const AVATAR_SIZE = 20
const OPTION_FILTER_PROP = 'searchLabel' as const

interface TokenSelectProps {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly options: TokenOption[]
  readonly placeholder: string
}

interface TokenSelectOption {
  readonly value: string
  readonly label: ReactElement
  readonly searchLabel: string
}

type TokenSelectConfig = Pick<TokenSelectProps, 'value' | 'onChange' | 'placeholder'> & {
  readonly options: TokenSelectOption[]
  readonly showSearch: true
  readonly filterOption: true
  readonly optionFilterProp: typeof OPTION_FILTER_PROP
}

const buildSelectOption = (option: TokenOption): TokenSelectOption => ({
  value: option.symbol,
  searchLabel: option.symbol,
  label: (
    <Space>
      <Avatar size={AVATAR_SIZE} src={option.iconUrl} alt={option.symbol} />
      <Typography.Text>{option.symbol}</Typography.Text>
    </Space>
  ),
})

const buildSelectConfig = (props: TokenSelectProps): TokenSelectConfig => ({
  value: props.value,
  onChange: props.onChange,
  placeholder: props.placeholder,
  options: props.options.map(buildSelectOption),
  showSearch: true,
  filterOption: true,
  optionFilterProp: OPTION_FILTER_PROP,
})

export const TokenSelect = (props: TokenSelectProps): ReactElement => {
  const config = buildSelectConfig(props)

  return <Select<string, TokenSelectOption> {...config} />
}
