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
  date: string;
  user_id?: number;
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

/** Parâmetros de filtro compartilhados entre listagem, resumo e exportação. */
export interface TransactionFilters {
  month?: string;
  year?: string;
  category?: string;
  search?: string;
}

/** Dados de formulário de transação (criar/editar). */
export interface TransactionPayload {
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
}
