export type WhatsAppTemplateKey = 'birthday' | 'followUp' | 'offer' | 'custom';

/**
 * Formats a phone number for the WhatsApp API.
 * Rules:
 * - Strip all non-numeric characters (spaces, dashes, parens)
 * - Remove leading '+'
 * - Replace leading '00' with nothing (just the country code)
 * - Replace leading '0' with default country code (e.g., 49 for Germany)
 */
export function formatWhatsAppNumber(phone: string | null | undefined, defaultCountryCode: string = '49'): string {
  if (!phone) return '';
  
  // Remove everything except digits and plus sign
  let cleaned = phone.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.replace(/\+/g, ''); // Remove all pluses
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0')) {
    cleaned = defaultCountryCode + cleaned.substring(1);
  }

  return cleaned;
}

/**
 * Generates a wa.me URL for sending a message.
 */
export function getWhatsAppLink(phone: string | null | undefined, text: string): string {
  const formattedPhone = formatWhatsAppNumber(phone);
  
  if (!formattedPhone) {
    // If no phone number exists, WhatsApp will just open and prompt to select a contact
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }
  
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
}
