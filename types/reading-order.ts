export interface ReadingFolder {
  id: string
  name: string
  description?: string
  books: ReadingOrderBook[]
  createdDate: string
}

export interface ReadingOrderBook {
  bookId: string
  order: number
  notes?: string
  addedDate: string
}
