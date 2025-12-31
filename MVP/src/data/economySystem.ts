/**
 * Economy System - SuperHero Tactics
 *
 * Weekly budget cycle with payday on Mondays.
 * Tracks income, expenses, and transaction history.
 *
 * Income Sources:
 * - Job pay (from day jobs)
 * - Mission rewards
 * - Investment returns
 * - Asset sales
 *
 * Expense Types:
 * - Base upkeep
 * - Medical expenses
 * - Education tuition
 * - Equipment maintenance
 * - Travel costs
 */

import { GameTime, isPayday } from './timeSystem';

// ============================================================================
// CORE TYPES
// ============================================================================

export type TransactionType = 'income' | 'expense' | 'purchase' | 'sale' | 'transfer';

export type TransactionCategory =
  // Income
  | 'job_pay'
  | 'mission_reward'
  | 'investment_return'
  | 'bounty_collected'
  | 'insurance_payout'
  | 'gift'

  // Expenses
  | 'base_upkeep'
  | 'medical_expense'
  | 'education_tuition'
  | 'equipment_maintenance'
  | 'travel_expense'
  | 'bribe'
  | 'fine'
  | 'salary_payment'  // Paying team members
  | 'insurance_premium'

  // Purchases & Sales
  | 'equipment_purchase'
  | 'equipment_sale'
  | 'vehicle_purchase'
  | 'vehicle_sale'
  | 'property_purchase'
  | 'property_sale'
  | 'service_purchase'

  // Other
  | 'other';

export interface Transaction {
  id: string;
  timestamp: number;           // Game day when transaction occurred
  hour: number;                // Hour of transaction
  type: TransactionType;
  category: TransactionCategory;
  amount: number;              // Positive = money in, Negative = money out
  description: string;
  relatedEntityId?: string;    // Character, equipment, or facility ID
  balanceAfter: number;        // Running balance after this transaction
}

export interface EconomyState {
  // Current balance
  cash: number;

  // Weekly tracking
  weeklyIncome: number;        // Total income this week
  weeklyExpenses: number;      // Total expenses this week
  lastPayday: number;          // Day number of last payday

  // Budget projections
  projectedWeeklyIncome: number;   // Expected income next week
  projectedWeeklyExpenses: number; // Expected expenses next week

  // History
  transactions: Transaction[];     // Recent transaction log
  maxTransactionHistory: number;   // How many to keep

  // Debt (optional future feature)
  debt: number;
  debtInterestRate: number;
}

// ============================================================================
// CATEGORY DISPLAY INFO
// ============================================================================

export const TRANSACTION_CATEGORY_INFO: Record<TransactionCategory, {
  name: string;
  icon: string;
  color: string;
  isIncome: boolean;
}> = {
  // Income categories
  job_pay: { name: 'Job Pay', icon: '💼', color: 'green', isIncome: true },
  mission_reward: { name: 'Mission Reward', icon: '🎯', color: 'green', isIncome: true },
  investment_return: { name: 'Investment Return', icon: '📈', color: 'green', isIncome: true },
  bounty_collected: { name: 'Bounty Collected', icon: '💰', color: 'green', isIncome: true },
  insurance_payout: { name: 'Insurance Payout', icon: '🛡️', color: 'green', isIncome: true },
  gift: { name: 'Gift', icon: '🎁', color: 'green', isIncome: true },

  // Expense categories
  base_upkeep: { name: 'Base Upkeep', icon: '🏠', color: 'red', isIncome: false },
  medical_expense: { name: 'Medical Expense', icon: '🏥', color: 'red', isIncome: false },
  education_tuition: { name: 'Tuition', icon: '🎓', color: 'red', isIncome: false },
  equipment_maintenance: { name: 'Equipment Maintenance', icon: '🔧', color: 'red', isIncome: false },
  travel_expense: { name: 'Travel Expense', icon: '✈️', color: 'red', isIncome: false },
  bribe: { name: 'Bribe', icon: '🤝', color: 'red', isIncome: false },
  fine: { name: 'Fine', icon: '⚖️', color: 'red', isIncome: false },
  salary_payment: { name: 'Team Salary', icon: '👥', color: 'red', isIncome: false },
  insurance_premium: { name: 'Insurance Premium', icon: '📋', color: 'red', isIncome: false },

  // Purchases & Sales
  equipment_purchase: { name: 'Equipment Purchase', icon: '🛒', color: 'orange', isIncome: false },
  equipment_sale: { name: 'Equipment Sale', icon: '💵', color: 'blue', isIncome: true },
  vehicle_purchase: { name: 'Vehicle Purchase', icon: '🚗', color: 'orange', isIncome: false },
  vehicle_sale: { name: 'Vehicle Sale', icon: '🚙', color: 'blue', isIncome: true },
  property_purchase: { name: 'Property Purchase', icon: '🏢', color: 'orange', isIncome: false },
  property_sale: { name: 'Property Sale', icon: '🏘️', color: 'blue', isIncome: true },
  service_purchase: { name: 'Service', icon: '🛎️', color: 'orange', isIncome: false },

  // Other
  other: { name: 'Other', icon: '📝', color: 'gray', isIncome: false },
};

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_ECONOMY_STATE: EconomyState = {
  cash: 10000,  // Starting budget

  weeklyIncome: 0,
  weeklyExpenses: 0,
  lastPayday: 0,

  projectedWeeklyIncome: 0,
  projectedWeeklyExpenses: 0,

  transactions: [],
  maxTransactionHistory: 100,

  debt: 0,
  debtInterestRate: 0.05, // 5% weekly
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a unique transaction ID
 */
export function generateTransactionId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new transaction
 */
export function createTransaction(
  type: TransactionType,
  category: TransactionCategory,
  amount: number,
  description: string,
  currentBalance: number,
  gameTime: GameTime,
  relatedEntityId?: string
): Transaction {
  const signedAmount = type === 'expense' || type === 'purchase'
    ? -Math.abs(amount)
    : type === 'income' || type === 'sale'
    ? Math.abs(amount)
    : amount; // Transfer keeps original sign

  return {
    id: generateTransactionId(),
    timestamp: gameTime.day,
    hour: gameTime.hour,
    type,
    category,
    amount: signedAmount,
    description,
    relatedEntityId,
    balanceAfter: currentBalance + signedAmount,
  };
}

/**
 * Create initial economy state
 */
export function createInitialEconomyState(startingCash: number = 10000): EconomyState {
  return {
    ...DEFAULT_ECONOMY_STATE,
    cash: startingCash,
  };
}

/**
 * Process a transaction and update economy state
 */
export function processTransaction(
  state: EconomyState,
  transaction: Transaction
): EconomyState {
  const newCash = state.cash + transaction.amount;

  // Update weekly tracking
  let newWeeklyIncome = state.weeklyIncome;
  let newWeeklyExpenses = state.weeklyExpenses;

  if (transaction.amount > 0) {
    newWeeklyIncome += transaction.amount;
  } else {
    newWeeklyExpenses += Math.abs(transaction.amount);
  }

  // Add to history, trim if needed
  const newTransactions = [transaction, ...state.transactions];
  if (newTransactions.length > state.maxTransactionHistory) {
    newTransactions.pop();
  }

  return {
    ...state,
    cash: newCash,
    weeklyIncome: newWeeklyIncome,
    weeklyExpenses: newWeeklyExpenses,
    transactions: newTransactions,
  };
}

/**
 * Process weekly payday
 * - Adds job income
 * - Deducts recurring expenses (base upkeep, salaries, etc.)
 * - Resets weekly tracking
 */
export function processPayday(
  state: EconomyState,
  jobIncome: number,
  recurringExpenses: { category: TransactionCategory; amount: number; description: string }[],
  gameTime: GameTime
): EconomyState {
  let newState = { ...state };

  // Add job income
  if (jobIncome > 0) {
    const incomeTransaction = createTransaction(
      'income',
      'job_pay',
      jobIncome,
      'Weekly job pay',
      newState.cash,
      gameTime
    );
    newState = processTransaction(newState, incomeTransaction);
  }

  // Process recurring expenses
  for (const expense of recurringExpenses) {
    const expenseTransaction = createTransaction(
      'expense',
      expense.category,
      expense.amount,
      expense.description,
      newState.cash,
      gameTime
    );
    newState = processTransaction(newState, expenseTransaction);
  }

  // Process debt interest if any
  if (newState.debt > 0) {
    const interest = Math.floor(newState.debt * newState.debtInterestRate);
    newState = {
      ...newState,
      debt: newState.debt + interest,
    };
  }

  // Reset weekly tracking and update lastPayday
  return {
    ...newState,
    weeklyIncome: 0,
    weeklyExpenses: 0,
    lastPayday: gameTime.day,
  };
}

/**
 * Check if player can afford a purchase
 */
export function canAfford(state: EconomyState, amount: number): boolean {
  return state.cash >= amount;
}

/**
 * Make a purchase (convenience function)
 */
export function makePurchase(
  state: EconomyState,
  category: TransactionCategory,
  amount: number,
  description: string,
  gameTime: GameTime,
  relatedEntityId?: string
): { success: boolean; newState: EconomyState; error?: string } {
  if (!canAfford(state, amount)) {
    return {
      success: false,
      newState: state,
      error: `Cannot afford $${amount.toLocaleString()}. Current balance: $${state.cash.toLocaleString()}`,
    };
  }

  const transaction = createTransaction(
    'purchase',
    category,
    amount,
    description,
    state.cash,
    gameTime,
    relatedEntityId
  );

  return {
    success: true,
    newState: processTransaction(state, transaction),
  };
}

/**
 * Receive income (convenience function)
 */
export function receiveIncome(
  state: EconomyState,
  category: TransactionCategory,
  amount: number,
  description: string,
  gameTime: GameTime,
  relatedEntityId?: string
): EconomyState {
  const transaction = createTransaction(
    'income',
    category,
    amount,
    description,
    state.cash,
    gameTime,
    relatedEntityId
  );

  return processTransaction(state, transaction);
}

/**
 * Pay expense (convenience function)
 */
export function payExpense(
  state: EconomyState,
  category: TransactionCategory,
  amount: number,
  description: string,
  gameTime: GameTime,
  relatedEntityId?: string
): { success: boolean; newState: EconomyState; error?: string } {
  if (!canAfford(state, amount)) {
    return {
      success: false,
      newState: state,
      error: `Cannot afford $${amount.toLocaleString()}. Current balance: $${state.cash.toLocaleString()}`,
    };
  }

  const transaction = createTransaction(
    'expense',
    category,
    amount,
    description,
    state.cash,
    gameTime,
    relatedEntityId
  );

  return {
    success: true,
    newState: processTransaction(state, transaction),
  };
}

/**
 * Sell an item (convenience function)
 */
export function sellItem(
  state: EconomyState,
  category: TransactionCategory,
  amount: number,
  description: string,
  gameTime: GameTime,
  relatedEntityId?: string
): EconomyState {
  const transaction = createTransaction(
    'sale',
    category,
    amount,
    description,
    state.cash,
    gameTime,
    relatedEntityId
  );

  return processTransaction(state, transaction);
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Get total income for a category
 */
export function getTotalByCategory(
  transactions: Transaction[],
  category: TransactionCategory
): number {
  return transactions
    .filter(t => t.category === category)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

/**
 * Get transactions for a specific day
 */
export function getTransactionsForDay(
  transactions: Transaction[],
  day: number
): Transaction[] {
  return transactions.filter(t => t.timestamp === day);
}

/**
 * Get transactions for a date range
 */
export function getTransactionsInRange(
  transactions: Transaction[],
  startDay: number,
  endDay: number
): Transaction[] {
  return transactions.filter(t => t.timestamp >= startDay && t.timestamp <= endDay);
}

/**
 * Calculate net worth (cash + assets - debt)
 * Assets would need to be passed in from game state
 */
export function calculateNetWorth(
  state: EconomyState,
  assetValue: number = 0
): number {
  return state.cash + assetValue - state.debt;
}

/**
 * Get weekly summary
 */
export function getWeeklySummary(state: EconomyState): {
  income: number;
  expenses: number;
  net: number;
  projectedNext: number;
} {
  return {
    income: state.weeklyIncome,
    expenses: state.weeklyExpenses,
    net: state.weeklyIncome - state.weeklyExpenses,
    projectedNext: state.projectedWeeklyIncome - state.projectedWeeklyExpenses,
  };
}

/**
 * Get expense breakdown by category
 */
export function getExpenseBreakdown(
  transactions: Transaction[]
): Record<TransactionCategory, number> {
  const breakdown: Partial<Record<TransactionCategory, number>> = {};

  transactions
    .filter(t => t.amount < 0)
    .forEach(t => {
      breakdown[t.category] = (breakdown[t.category] || 0) + Math.abs(t.amount);
    });

  return breakdown as Record<TransactionCategory, number>;
}

/**
 * Get income breakdown by category
 */
export function getIncomeBreakdown(
  transactions: Transaction[]
): Record<TransactionCategory, number> {
  const breakdown: Partial<Record<TransactionCategory, number>> = {};

  transactions
    .filter(t => t.amount > 0)
    .forEach(t => {
      breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
    });

  return breakdown as Record<TransactionCategory, number>;
}

// ============================================================================
// FORMAT FUNCTIONS
// ============================================================================

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  const formatted = absAmount >= 1000000
    ? `$${(absAmount / 1000000).toFixed(1)}M`
    : absAmount >= 1000
    ? `$${(absAmount / 1000).toFixed(1)}K`
    : `$${absAmount.toLocaleString()}`;

  return amount < 0 ? `-${formatted}` : formatted;
}

/**
 * Format currency with full precision
 */
export function formatCurrencyFull(amount: number): string {
  const prefix = amount < 0 ? '-' : '';
  return `${prefix}$${Math.abs(amount).toLocaleString()}`;
}

/**
 * Get category display info
 */
export function getCategoryInfo(category: TransactionCategory) {
  return TRANSACTION_CATEGORY_INFO[category] || TRANSACTION_CATEGORY_INFO.other;
}

// ============================================================================
// BUDGET PLANNING
// ============================================================================

export interface BudgetPlan {
  expectedIncome: {
    jobs: number;
    missions: number;
    investments: number;
    other: number;
  };
  plannedExpenses: {
    baseUpkeep: number;
    salaries: number;
    medical: number;
    education: number;
    maintenance: number;
    other: number;
  };
  surplus: number;
}

/**
 * Create a budget plan for the week
 */
export function createBudgetPlan(
  jobIncome: number,
  missionEstimate: number,
  investmentReturn: number,
  baseUpkeep: number,
  teamSalaries: number,
  medicalEstimate: number,
  educationCost: number,
  maintenanceCost: number,
  otherExpenses: number = 0
): BudgetPlan {
  const totalIncome = jobIncome + missionEstimate + investmentReturn;
  const totalExpenses = baseUpkeep + teamSalaries + medicalEstimate + educationCost + maintenanceCost + otherExpenses;

  return {
    expectedIncome: {
      jobs: jobIncome,
      missions: missionEstimate,
      investments: investmentReturn,
      other: 0,
    },
    plannedExpenses: {
      baseUpkeep,
      salaries: teamSalaries,
      medical: medicalEstimate,
      education: educationCost,
      maintenance: maintenanceCost,
      other: otherExpenses,
    },
    surplus: totalIncome - totalExpenses,
  };
}

/**
 * Update projected income/expenses in state
 */
export function updateProjections(
  state: EconomyState,
  plan: BudgetPlan
): EconomyState {
  const totalIncome =
    plan.expectedIncome.jobs +
    plan.expectedIncome.missions +
    plan.expectedIncome.investments +
    plan.expectedIncome.other;

  const totalExpenses =
    plan.plannedExpenses.baseUpkeep +
    plan.plannedExpenses.salaries +
    plan.plannedExpenses.medical +
    plan.plannedExpenses.education +
    plan.plannedExpenses.maintenance +
    plan.plannedExpenses.other;

  return {
    ...state,
    projectedWeeklyIncome: totalIncome,
    projectedWeeklyExpenses: totalExpenses,
  };
}

// ============================================================================
// LOAN SYSTEM (Future Feature)
// ============================================================================

export interface Loan {
  id: string;
  principal: number;
  interestRate: number;      // Weekly rate
  remainingBalance: number;
  weeklyPayment: number;
  lender: string;            // Bank, criminal, etc.
  startDay: number;
  dueDay: number;
}

/**
 * Calculate weekly payment for a loan
 */
export function calculateLoanPayment(
  principal: number,
  interestRate: number,
  weeks: number
): number {
  if (interestRate === 0) return principal / weeks;

  const rate = interestRate;
  const payment = (principal * rate * Math.pow(1 + rate, weeks)) /
                  (Math.pow(1 + rate, weeks) - 1);

  return Math.ceil(payment);
}

/**
 * Take out a loan
 */
export function takeLoan(
  state: EconomyState,
  amount: number,
  interestRate: number,
  gameTime: GameTime
): EconomyState {
  const transaction = createTransaction(
    'income',
    'other',
    amount,
    'Loan received',
    state.cash,
    gameTime
  );

  const newState = processTransaction(state, transaction);

  return {
    ...newState,
    debt: newState.debt + amount,
    debtInterestRate: Math.max(newState.debtInterestRate, interestRate),
  };
}

/**
 * Make debt payment
 */
export function payDebt(
  state: EconomyState,
  amount: number,
  gameTime: GameTime
): { success: boolean; newState: EconomyState; error?: string } {
  const paymentAmount = Math.min(amount, state.debt, state.cash);

  if (paymentAmount <= 0) {
    return { success: false, newState: state, error: 'No debt to pay or insufficient funds.' };
  }

  const transaction = createTransaction(
    'expense',
    'other',
    paymentAmount,
    'Debt payment',
    state.cash,
    gameTime
  );

  const newState = processTransaction(state, transaction);

  return {
    success: true,
    newState: {
      ...newState,
      debt: newState.debt - paymentAmount,
    },
  };
}
