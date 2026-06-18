import twilio from 'twilio';

export class SMSService {
  private client: any;
  private isConfigured: boolean;

  constructor() {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      this.isConfigured = true;
    } else {
      console.warn('Twilio not configured. SMS features disabled.');
      this.isConfigured = false;
    }
  }

  async sendOTP(phoneNumber: string, otp: string): Promise<boolean> {
    if (!this.isConfigured) {
      console.log(`[SMS Mock] OTP for ${phoneNumber}: ${otp}`);
      return true;
    }

    try {
      await this.client.messages.create({
        body: `Your Moto-Bus verification code is: ${otp}. Valid for 10 minutes.`,
        to: phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
      });
      return true;
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }

  async sendRideConfirmation(
    riderPhone: string,
    driverName: string,
    vehicleNumber: string,
    eta: number
  ): Promise<boolean> {
    if (!this.isConfigured) {
      console.log(`[SMS Mock] Ride confirmation to ${riderPhone}: Driver ${driverName} arriving in ${eta} min`);
      return true;
    }

    try {
      await this.client.messages.create({
        body: `🚲 Moto-Bus: Your driver ${driverName} (${vehicleNumber}) is on the way. ETA: ${eta} minutes. Track your ride in the app.`,
        to: riderPhone,
        from: process.env.TWILIO_PHONE_NUMBER,
      });
      return true;
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }

  async sendRideCompleted(riderPhone: string, fare: number): Promise<boolean> {
    if (!this.isConfigured) {
      console.log(`[SMS Mock] Ride completed to ${riderPhone}: Fare RWF ${fare}`);
      return true;
    }

    try {
      await this.client.messages.create({
        body: `✅ Moto-Bus: Your ride is complete. Final fare: RWF ${fare}. Thank you for riding with us!`,
        to: riderPhone,
        from: process.env.TWILIO_PHONE_NUMBER,
      });
      return true;
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }

  async sendDriverEarnings(driverPhone: string, amount: number, period: string): Promise<boolean> {
    if (!this.isConfigured) {
      console.log(`[SMS Mock] Earnings to ${driverPhone}: RWF ${amount} for ${period}`);
      return true;
    }

    try {
      await this.client.messages.create({
        body: `💰 Moto-Bus: Your ${period} earnings: RWF ${amount}. Keep up the great work!`,
        to: driverPhone,
        from: process.env.TWILIO_PHONE_NUMBER,
      });
      return true;
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }

  async sendSOS(emergencyContact: string, data: {
    userName: string;
    driverName?: string;
    vehicleNumber?: string;
    location: string;
    rideId: string;
  }): Promise<boolean> {
    if (!this.isConfigured) {
      console.log(`[SMS Mock] SOS to ${emergencyContact}:`, data);
      return true;
    }

    const message = `🚨 SOS ALERT 🚨\n\nUser: ${data.userName}\nDriver: ${data.driverName || 'Unknown'}\nVehicle: ${data.vehicleNumber || 'N/A'}\nLocation: ${data.location}\nRide ID: ${data.rideId}\n\nPlease check on them immediately.`;
    
    try {
      await this.client.messages.create({
        body: message,
        to: emergencyContact,
        from: process.env.TWILIO_PHONE_NUMBER,
      });
      return true;
    } catch (error) {
      console.error('SOS SMS sending failed:', error);
      return false;
    }
  }

  async sendWelcomeMessage(phoneNumber: string, userName: string): Promise<boolean> {
    if (!this.isConfigured) {
      console.log(`[SMS Mock] Welcome to ${phoneNumber}: ${userName}`);
      return true;
    }

    try {
      await this.client.messages.create({
        body: `🎉 Welcome to Moto-Bus, ${userName}! Download our app to start booking rides instantly.`,
        to: phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
      });
      return true;
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }

  async sendPromotion(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.isConfigured) {
      console.log(`[SMS Mock] Promotion to ${phoneNumber}: ${message}`);
      return true;
    }

    try {
      await this.client.messages.create({
        body: `🎁 Moto-Bus: ${message}`,
        to: phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
      });
      return true;
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }
}