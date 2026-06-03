import axios from 'axios';
import { whatsappConfig, isWhatsAppConfigured } from '../config/whatsapp.js';

const whatsappApi = axios.create({
  baseURL: 'https://graph.facebook.com/v17.0',
  headers: {
    'Authorization': `Bearer ${whatsappConfig.accessToken}`,
    'Content-Type': 'application/json',
  }
});

export const whatsappService = {
  async list() {
    return [];
  },
  
  async get(id: string) {
    return { id };
  },
  
  async create<TPayload extends Record<string, unknown>>(payload: TPayload) {
    const { to, message, type } = payload as unknown as { 
      to: string; 
      message: string; 
      type?: 'text' | 'image' | 'document' | 'template'
    };
    
    if (!isWhatsAppConfigured()) {
      // Return simulated response when not configured
      return { 
        id: `whatsapp_${Date.now()}`, 
        to, 
        message, 
        type: type || 'text',
        status: 'SIMULATED_SENT' 
      };
    }
    
    try {
      const response = await whatsappApi.post(
        `/${whatsappConfig.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: type || 'text',
          text: type === 'text' ? { body: message } : undefined,
          // For other types, you would add appropriate structure
        }
      );
      
      return { 
        id: response.data.messages[0].id,
        to,
        message,
        type: type || 'text',
        status: 'SENT'
      };
    } catch (error) {
      console.error('WhatsApp send error:', error);
      throw error;
    }
  }
};
