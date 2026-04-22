import { Avatar, Modal, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { ReactElement } from 'react'
import type { TokenOption } from '../../tokens/types/token.types'
import { formatCurrencyValue } from '../../tokens/utils/token.utils'
import './CurrencyPricesModal.scss'

const MODAL_TITLE = 'Currency Prices'
const MODAL_WIDTH = 480
const TABLE_PAGE_SIZE = 10
const TABLE_SCROLL_Y = 400
const TOKEN_AVATAR_SIZE = 24
const PRICE_PREFIX = '$'

interface CurrencyPricesModalProps {
  readonly open: boolean
  readonly onClose: () => void
  readonly tokens: TokenOption[]
}

const COLUMNS: ColumnsType<TokenOption> = [
  {
    title: 'Token',
    dataIndex: 'symbol',
    key: 'symbol',
    sorter: (a, b) => a.symbol.localeCompare(b.symbol),
    render: (symbol: string, record: TokenOption): ReactElement => (
      <div className="currency-prices-modal__token-cell">
        <Avatar src={record.iconUrl} size={TOKEN_AVATAR_SIZE} alt={symbol} />
        <span className="currency-prices-modal__token-symbol">{symbol}</span>
      </div>
    ),
  },
  {
    title: 'Price (USD)',
    dataIndex: 'price',
    key: 'price',
    align: 'right',
    sorter: (a, b) => a.price - b.price,
    render: (price: number): string => `${PRICE_PREFIX}${formatCurrencyValue(price)}`,
  },
]

export const CurrencyPricesModal = ({
  open,
  onClose,
  tokens,
}: CurrencyPricesModalProps): ReactElement => (
  <Modal
    title={MODAL_TITLE}
    open={open}
    onCancel={onClose}
    footer={null}
    width={MODAL_WIDTH}
    className="currency-prices-modal"
  >
    <Table<TokenOption>
      columns={COLUMNS}
      dataSource={tokens}
      rowKey="symbol"
      size="small"
      pagination={{ pageSize: TABLE_PAGE_SIZE, showSizeChanger: false }}
      scroll={{ y: TABLE_SCROLL_Y }}
    />
  </Modal>
)
