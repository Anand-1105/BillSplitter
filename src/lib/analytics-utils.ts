import { Transaction } from "@/contexts/TransactionContext";

// Format currency values
export const formatCurrency = (amount: number, currency: string): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(amount);
};

// Get most recent transactions
export const getRecentTransactions = (transactions: Transaction[], count: number = 5): Transaction[] => {
  return [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);
};

// Calculate spending by category
export type CategorySummary = {
  category: string;
  totalAmount: number;
  count: number;
  currency: string;
};

export const calculateSpendingByCategory = (transactions: Transaction[]): CategorySummary[] => {
  const categoryMap = new Map<string, { totalAmount: number; count: number; currency: string }>();
  
  transactions.forEach(transaction => {
    const existing = categoryMap.get(transaction.category);
    
    if (existing) {
      categoryMap.set(transaction.category, {
        totalAmount: existing.totalAmount + transaction.amount,
        count: existing.count + 1,
        currency: transaction.currency // Use most recent transaction's currency
      });
    } else {
      categoryMap.set(transaction.category, {
        totalAmount: transaction.amount,
        count: 1,
        currency: transaction.currency
      });
    }
  });
  
  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      ...data
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
};

// Calculate monthly spending
export type MonthlyData = {
  [key: string]: { // Format: YYYY-MM
    totalAmount: number;
    count: number;
    currency: string;
  }
};

export const calculateMonthlySpending = (transactions: Transaction[]): MonthlyData => {
  const monthlyData: MonthlyData = {};
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed
    const key = `${year}-${month.toString().padStart(2, '0')}`;
    
    if (monthlyData[key]) {
      monthlyData[key].totalAmount += transaction.amount;
      monthlyData[key].count += 1;
      // Keep most common currency or use the latest transaction's currency
      monthlyData[key].currency = transaction.currency;
    } else {
      monthlyData[key] = {
        totalAmount: transaction.amount,
        count: 1,
        currency: transaction.currency
      };
    }
  });
  
  return monthlyData;
};

// Calculate spending trends
export const calculateSpendingTrend = (transactions: Transaction[], months: number = 3): {
  increasingCategories: string[];
  decreasingCategories: string[];
} => {
  const now = new Date();
  const monthsAgo = new Date();
  monthsAgo.setMonth(now.getMonth() - months);
  
  // Split transactions into recent and older
  const recentTransactions = transactions.filter(t => new Date(t.date) >= monthsAgo);
  const olderTransactions = transactions.filter(t => new Date(t.date) < monthsAgo && new Date(t.date) >= new Date(monthsAgo.getFullYear(), monthsAgo.getMonth() - months, monthsAgo.getDate()));
  
  // Calculate categories for both periods
  const recentCategories = calculateSpendingByCategory(recentTransactions);
  const olderCategories = calculateSpendingByCategory(olderTransactions);
  
  // Find increasing and decreasing categories
  const increasingCategories: string[] = [];
  const decreasingCategories: string[] = [];
  
  recentCategories.forEach(recent => {
    const older = olderCategories.find(o => o.category === recent.category);
    
    if (older) {
      if (recent.totalAmount > older.totalAmount * 1.2) { // 20% increase
        increasingCategories.push(recent.category);
      } else if (recent.totalAmount < older.totalAmount * 0.8) { // 20% decrease
        decreasingCategories.push(recent.category);
      }
    }
  });
  
  return { increasingCategories, decreasingCategories };
};

// Get top spending days
export const getTopSpendingDays = (transactions: Transaction[]): { day: string; amount: number; currency: string }[] => {
  const dayMap = new Map<string, { amount: number; currency: string }>();
  
  // Group transactions by day of week
  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const day = date.toLocaleString('en-US', { weekday: 'long' });
    
    const existing = dayMap.get(day);
    if (existing) {
      dayMap.set(day, {
        amount: existing.amount + transaction.amount,
        currency: transaction.currency
      });
    } else {
      dayMap.set(day, {
        amount: transaction.amount,
        currency: transaction.currency
      });
    }
  });
  
  // Convert to array and sort
  return Array.from(dayMap.entries())
    .map(([day, data]) => ({
      day,
      ...data
    }))
    .sort((a, b) => b.amount - a.amount);
}; 