export interface PriceRecord {
  readonly currency: string
  readonly date: string
  readonly price: number
}

export interface PriceMap {
  [currency: string]: number
}
