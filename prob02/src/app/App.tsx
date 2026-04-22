import { Layout, Typography } from 'antd'
import type { ReactElement } from 'react'
import { SwapCard } from '../features/swap/components/SwapCard'
import './App.scss'

const { Content } = Layout
const { Title, Paragraph } = Typography

export const App = (): ReactElement => {
  return (
    <Layout className="app-layout">
      <Content className="app-content">
        <div className="app-header">
          <Title level={2} className="app-title">
            Currency Swap
          </Title>
          <Paragraph className="app-subtitle">
            Swap assets using live market prices.
          </Paragraph>
        </div>
        <SwapCard />
      </Content>
    </Layout>
  )
}
