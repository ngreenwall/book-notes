export const UNCATEGORIZED_BOOK_ID = "uncategorized";

export type Book = {
  id: string;
  title: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  isSystem?: boolean;
};
