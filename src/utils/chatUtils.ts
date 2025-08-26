// Utility functions for chat message processing

export interface ContactData {
  name: string;
  email: string;
  phone?: string;
  message?: string;
}

/**
 * Sanitizes bot messages by removing markdown characters and normalizing spaces
 */
export const sanitizeBotMessage = (message: string): string => {
  if (!message) return '';
  
  return message
    // Remove asterisks used for bold formatting
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    // Remove underscore formatting
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    // Remove hash formatting
    .replace(/#{1,6}\s/g, '')
    // Remove extra whitespace and normalize spaces
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Personalizes message by replacing placeholders with contact data
 */
export const personalizeMessage = (message: string, contactData?: ContactData): string => {
  if (!message || !contactData) return message;
  
  const firstName = contactData.name?.split(' ')[0] || contactData.name || '';
  
  return message
    .replace(/\{name\}/gi, contactData.name || '')
    .replace(/\{first_name\}/gi, firstName)
    .replace(/\{email\}/gi, contactData.email || '');
};

/**
 * Processes bot message with sanitization and personalization
 */
export const processBotMessage = (message: string, contactData?: ContactData): string => {
  const personalizedMessage = personalizeMessage(message, contactData);
  return sanitizeBotMessage(personalizedMessage);
};