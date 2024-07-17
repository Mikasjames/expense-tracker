// Transaction model
interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  date: Date;
  tagIds: string[];
}

// Tag model
interface Tag {
  id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense' | 'both';
  color?: string;
}
