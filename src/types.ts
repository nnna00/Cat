export interface Account {
  id: number;
  name: string;
  balance: number;
  icon: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  timestamp: string;
  account_id: number;
  account_name?: string;
  note: string;
  goal_id?: number;
  goal_name?: string;
}

export interface Character {
  id: number;
  name: string;
  description: string;
  personality: string;
  greeting: string;
  avatar: string;
  created_at: string;
}

export interface Message {
  id: number;
  character_id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  icon: string;
  deadline?: string;
  status: 'active' | 'completed';
  created_at: string;
}

export type Category = 
  | '餐饮' 
  | '服装' 
  | '氪金' 
  | '交通' 
  | '投资' 
  | '购物' 
  | '娱乐' 
  | '医疗' 
  | '教育' 
  | '住房'
  | '攒钱'
  | '其他';

export const CATEGORIES: Category[] = [
  '餐饮', '服装', '氪金', '交通', '投资', '购物', '娱乐', '医疗', '教育', '住房', '攒钱', '其他'
];
