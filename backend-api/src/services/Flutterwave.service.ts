// Use require to avoid TypeScript module resolution errors when types are not available
const Flutterwave = require('flutterwave-node-v3');

class FlutterwaveService {
  private flw: any;

  constructor() {
    this.flw = new Flutterwave(
      process.env.FLW_PUBLIC_KEY,
      process.env.FLW_SECRET_KEY,
      process.env.FLW_ENCRYPTION_KEY
    );
  }

  // Initialize payment for a ride
  async initializePayment(data: {
    tx_ref: string;
    amount: number;
    email: string;
    phoneNumber: string;
    name: string;
    paymentMethod?: string;
  }) {
    try {
      const payload = {
        tx_ref: data.tx_ref,
        amount: data.amount,
        currency: "RWF",
        redirect_url: `${process.env.FRONTEND_URL}/payment/callback`,
        payment_options: data.paymentMethod || "card,mobilemoney,ussd",
        meta: {
          consumer_id: 23,
          consumer_mac: "92a3-912ba-1192a",
        },
        customer: {
          email: data.email,
          phonenumber: data.phoneNumber,
          name: data.name,
        },
        customizations: {
          title: "Moto-Bus Tracker",
          description: "Ride Payment",
          logo: "https://your-logo-url.com/logo.png",
        },
      };

      const response = await this.flw.Charge(payload);
      return response;
    } catch (error) {
      console.error('Flutterwave payment init error:', error);
      throw error;
    }
  }

  // Verify payment
  async verifyPayment(transactionId: string) {
    try {
      const response = await this.flw.Transaction.verify({ id: transactionId });
      return response;
    } catch (error) {
      console.error('Flutterwave verification error:', error);
      throw error;
    }
  }

  // Process refund
  async processRefund(transactionId: string, amount: number) {
    try {
      const response = await this.flw.Transaction.refund({
        id: transactionId,
        amount: amount,
      });
      return response;
    } catch (error) {
      console.error('Flutterwave refund error:', error);
      throw error;
    }
  }

  // Initiate withdrawal to driver's mobile money
  async initiateWithdrawal(data: {
    amount: number;
    phoneNumber: string;
    email: string;
    name: string;
    narration: string;
  }) {
    try {
      const payload = {
        tx_ref: `WTH-${Date.now()}`,
        amount: data.amount,
        currency: "RWF",
        email: data.email,
        phone_number: data.phoneNumber,
        name: data.name,
        narration: data.narration,
        beneficiary_name: data.name,
        beneficiary_phone: data.phoneNumber,
        beneficiary_email: data.email,
      };

      // For mobile money payout
      const response = await this.flw.Payout.create(payload);
      return response;
    } catch (error) {
      console.error('Flutterwave withdrawal error:', error);
      throw error;
    }
  }

  // Get balance
  async getBalance() {
    try {
      const response = await this.flw.Balance.fetch();
      return response;
    } catch (error) {
      console.error('Flutterwave balance error:', error);
      throw error;
    }
  }
}

export default new FlutterwaveService();