// services/wallet.service.ts
import { useWalletStore } from '@/store/wallet.store';

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

class WalletService {
  // ── Use store methods ────────────────────────────────────────────
  async getWallet() {
    const { fetchWallet, wallet } = useWalletStore.getState();
    if (!wallet) {
      await fetchWallet();
    }
    return useWalletStore.getState().wallet;
  }

  async getTransactions(filter?: any) {
    const { fetchTransactions } = useWalletStore.getState();
    await fetchTransactions(filter);
    return useWalletStore.getState().transactions;
  }

  async initiatePayment(data: PaymentRequest): Promise<PaymentResponse> {
    const { initiatePayment } = useWalletStore.getState();
    return initiatePayment(data);
  }

  async processPayment(paymentId: string): Promise<PaymentResponse> {
    const { processPayment } = useWalletStore.getState();
    return processPayment(paymentId);
  }

  async validatePromoCode(code: string) {
    const { validatePromoCode } = useWalletStore.getState();
    return validatePromoCode(code);
  }

  async simulateFlutterwavePayment(amount: number, method: string) {
    const { simulateFlutterwavePayment } = useWalletStore.getState();
    return simulateFlutterwavePayment(amount, method);
  }

  // ── WebSocket ──────────────────────────────────────────────────────
  connectWebSocket(userId: string) {
    const { connectWebSocket } = useWalletStore.getState();
    connectWebSocket(userId);
  }

  disconnectWebSocket() {
    const { disconnectWebSocket } = useWalletStore.getState();
    disconnectWebSocket();
  }

  // ── Event System (for WebSocket) ─────────────────────────────────
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event)!;
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  private emit(event: string, data: any) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event)!.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error("Event callback error:", error);
      }
    });
  }
}

export default new WalletService();