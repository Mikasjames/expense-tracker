export interface TransactionForm {
  title: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  date: Date;
  tagIds: string[];
}

export interface Transaction extends TransactionForm {
  id: string;
  userId: string;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense' | 'both';
}
