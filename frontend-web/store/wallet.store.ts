// store/wallet.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Types ──────────────────────────────────────────────────────────
export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  status: "completed" | "pending" | "failed";
  method: string;
  reference?: string;
  metadata?: any;
}

export interface WalletData {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  transactions: Transaction[];
  stats: {
    totalSpent: number;
    totalReceived: number;
    pendingAmount: number;
    monthlySpending: number;
  };
}

export interface PaymentRequest {
  amount: number;
  method: string;
  promoCode?: string;
  metadata?: any;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  amount: number;
  method: string;
  status: string;
  message: string;
  data?: any;
}

// ── Mock Data ─────────────────────────────────────────────────────
const MOCK_WALLET: WalletData = {
  id: 'wallet-123',
  userId: 'user-123',
  balance: 25000,
  currency: 'RWF',
  transactions: [
    {
      id: 'tx-1',
      date: new Date().toISOString(),
      description: 'Wallet funded via MTN MoMo',
      amount: 10000,
      type: 'credit',
      status: 'completed',
      method: 'momo',
      reference: 'REF-123456'
    },
    {
      id: 'tx-2',
      date: new Date(Date.now() - 86400000).toISOString(),
      description: 'Bus ticket purchase - Kigali to Musanze',
      amount: 5000,
      type: 'debit',
      status: 'completed',
      method: 'wallet',
      reference: 'REF-789012'
    },
    {
      id: 'tx-3',
      date: new Date(Date.now() - 172800000).toISOString(),
      description: 'Wallet funded via Airtel Money',
      amount: 20000,
      type: 'credit',
      status: 'pending',
      method: 'airtel',
      reference: 'REF-345678'
    },
    {
      id: 'tx-4',
      date: new Date(Date.now() - 259200000).toISOString(),
      description: 'Sent to John Doe',
      amount: 3000,
      type: 'debit',
      status: 'completed',
      method: 'wallet',
      reference: 'REF-901234'
    }
  ],
  stats: {
    totalSpent: 8000,
    totalReceived: 30000,
    pendingAmount: 20000,
    monthlySpending: 5000
  }
};

// ── Store ──────────────────────────────────────────────────────────
interface WalletState {
  wallet: WalletData | null;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  
  // Actions
  fetchWallet: () => Promise<void>;
  fetchTransactions: (filter?: any) => Promise<void>;
  updateBalance: (amount: number) => void;
  addTransaction: (transaction: Transaction) => void;
  initiatePayment: (data: PaymentRequest) => Promise<PaymentResponse>;
  processPayment: (paymentId: string) => Promise<PaymentResponse>;
  validatePromoCode: (code: string) => Promise<{ valid: boolean; discount: number; message: string }>;
  simulateFlutterwavePayment: (amount: number, method: string) => Promise<PaymentResponse>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
  connectWebSocket: (userId: string) => void;
  disconnectWebSocket: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallet: MOCK_WALLET,
      transactions: MOCK_WALLET.transactions,
      isLoading: false,
      error: null,
      isConnected: false,

      // ── Fetch Wallet ──────────────────────────────────────────────
      fetchWallet: async () => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 800));
          
          set({ 
            wallet: MOCK_WALLET,
            transactions: MOCK_WALLET.transactions,
            isLoading: false 
          });
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to fetch wallet', 
            isLoading: false 
          });
        }
      },

      // ── Fetch Transactions ────────────────────────────────────────
      fetchTransactions: async (filter?: any) => {
        set({ isLoading: true, error: null });
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          let transactions = MOCK_WALLET.transactions;
          
          if (filter?.status) {
            transactions = transactions.filter(tx => tx.status === filter.status);
          }
          if (filter?.type) {
            transactions = transactions.filter(tx => tx.type === filter.type);
          }
          if (filter?.limit) {
            transactions = transactions.slice(0, filter.limit);
          }
          
          set({ 
            transactions,
            isLoading: false 
          });
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to fetch transactions', 
            isLoading: false 
          });
        }
      },

      // ── Update Balance ────────────────────────────────────────────
      updateBalance: (amount: number) => {
        set((state) => {
          if (!state.wallet) return state;
          
          const transaction: Transaction = {
            id: `tx-${Date.now()}`,
            date: new Date().toISOString(),
            description: amount >= 0 ? 'Wallet funded' : 'Wallet withdrawal',
            amount: Math.abs(amount),
            type: amount >= 0 ? 'credit' : 'debit',
            status: 'completed',
            method: 'flutterwave',
            reference: `REF-${Date.now()}`,
          };

          const updatedWallet = {
            ...state.wallet,
            balance: state.wallet.balance + amount,
            transactions: [transaction, ...state.wallet.transactions],
            stats: {
              ...state.wallet.stats,
              totalReceived: amount >= 0 
                ? state.wallet.stats.totalReceived + amount 
                : state.wallet.stats.totalReceived,
              totalSpent: amount < 0 
                ? state.wallet.stats.totalSpent + Math.abs(amount) 
                : state.wallet.stats.totalSpent,
            }
          };

          return { 
            wallet: updatedWallet,
            transactions: [transaction, ...state.transactions]
          };
        });
      },

      // ── Add Transaction ───────────────────────────────────────────
      addTransaction: (transaction: Transaction) => {
        set((state) => ({
          transactions: [transaction, ...state.transactions],
          wallet: state.wallet ? {
            ...state.wallet,
            transactions: [transaction, ...state.wallet.transactions]
          } : null
        }));
      },

      // ── Initiate Payment ──────────────────────────────────────────
      initiatePayment: async (data: PaymentRequest) => {
        set({ isLoading: true, error: null });
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const transactionId = `FLW-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          
          const response: PaymentResponse = {
            success: true,
            transactionId,
            amount: data.amount,
            method: data.method,
            status: 'pending',
            message: 'Payment initiated successfully',
            data: {
              reference: `REF-${Date.now()}`,
              timestamp: new Date().toISOString()
            }
          };
          
          set({ isLoading: false });
          return response;
        } catch (error: any) {
          set({ 
            error: error.message || 'Payment initiation failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      // ── Process Payment ───────────────────────────────────────────
      processPayment: async (paymentId: string) => {
        set({ isLoading: true, error: null });
        try {
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // 90% success rate
          const isSuccess = Math.random() < 0.9;
          
          if (isSuccess) {
            const response: PaymentResponse = {
              success: true,
              transactionId: paymentId,
              amount: 1000,
              method: 'momo',
              status: 'completed',
              message: 'Payment processed successfully',
              data: {
                reference: `REF-${Date.now()}`,
                timestamp: new Date().toISOString()
              }
            };
            
            // Update balance
            get().updateBalance(response.amount);
            
            set({ isLoading: false });
            return response;
          } else {
            throw new Error('Payment failed. Please try again.');
          }
        } catch (error: any) {
          set({ 
            error: error.message || 'Payment processing failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      // ── Validate Promo Code ──────────────────────────────────────
      validatePromoCode: async (code: string) => {
        set({ isLoading: true, error: null });
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const promoMap: Record<string, number> = {
            'WELCOME10': 10,
            'SAVE20': 20,
            'BONUS50': 50,
            'FREEFUND': 100,
            'FLASH25': 25,
          };
          
          const discount = promoMap[code.toUpperCase()];
          
          if (discount) {
            return {
              valid: true,
              discount,
              message: `🎉 ${discount}% discount applied!`
            };
          } else {
            return {
              valid: false,
              discount: 0,
              message: 'Invalid promo code'
            };
          }
        } catch (error: any) {
          set({ error: error.message || 'Promo validation failed', isLoading: false });
          throw error;
        }
      },

      // ── Simulate Flutterwave Payment ─────────────────────────────
      simulateFlutterwavePayment: async (amount: number, method: string) => {
        set({ isLoading: true, error: null });
        try {
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const isSuccess = Math.random() < 0.9;
          
          if (isSuccess) {
            const response: PaymentResponse = {
              success: true,
              transactionId: `FLW-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
              amount,
              method,
              status: 'completed',
              message: 'Payment successful',
              data: {
                reference: `REF-${Date.now()}`,
                timestamp: new Date().toISOString()
              }
            };
            
            // Update balance
            get().updateBalance(amount);
            
            set({ isLoading: false });
            return response;
          } else {
            throw new Error('Payment failed. Please try again.');
          }
        } catch (error: any) {
          set({ 
            error: error.message || 'Payment failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      // ── Set Loading ──────────────────────────────────────────────
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // ── Set Error ─────────────────────────────────────────────────
      setError: (error: string | null) => {
        set({ error });
      },

      // ── Clear Error ──────────────────────────────────────────────
      clearError: () => {
        set({ error: null });
      },

      // ── Reset Store ──────────────────────────────────────────────
      reset: () => {
        set({ 
          wallet: MOCK_WALLET,
          transactions: MOCK_WALLET.transactions,
          isLoading: false,
          error: null,
          isConnected: false
        });
      },

      // ── WebSocket ─────────────────────────────────────────────────
      connectWebSocket: (userId: string) => {
        set({ isConnected: true });
        console.log('🔗 WebSocket connected for user:', userId);
      },

      disconnectWebSocket: () => {
        set({ isConnected: false });
        console.log('🔗 WebSocket disconnected');
      },
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        wallet: state.wallet,
        // Don't persist transactions, isLoading, error, isConnected
      }),
    }
  )
);

// ── Selectors ─────────────────────────────────────────────────────
export const useWalletBalance = () => useWalletStore((state) => state.wallet?.balance || 0);
export const useWalletTransactions = () => useWalletStore((state) => state.transactions);
export const useWalletLoading = () => useWalletStore((state) => state.isLoading);
export const useWalletError = () => useWalletStore((state) => state.error);
export const useWalletConnection = () => useWalletStore((state) => state.isConnected);
export const useWalletStats = () => {
  const wallet = useWalletStore((state) => state.wallet);
  return wallet?.stats || {
    totalSpent: 0,
    totalReceived: 0,
    pendingAmount: 0,
    monthlySpending: 0,
  };
};