export type TransactionType = 'income' | 'expense';

export type TransactionCategory = 
  | 'Alimentação'
  | 'Transporte'
  | 'Moradia'
  | 'Saúde'
  | 'Educação'
  | 'Lazer'
  | 'Trabalho'
  | 'Outros';

export interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  created_at: string;
  date?: string;
}

export interface Summary {
  total_income: number;
  total_expense: number;
  balance: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}