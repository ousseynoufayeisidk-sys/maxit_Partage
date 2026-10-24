import { nanoid } from 'nanoid';
import { nationalPhone } from './payment-input';
import { supabase } from './supabase';

/**
 * Generate a unique, URL-safe invite token.
 * Uses nanoid to create a 21-character token.
 * 
 * @returns string - A unique invite token
 */
export function generateInviteToken(): string {
  return nanoid(21);
}

/**
 * Normalize a Senegalese phone number to E.164 format (+221XXXXXXXXX).
 * Validates that the national number contains exactly 9 digits.
 * 
 * @param input - Raw phone number input (can include formatting, country code, etc.)
 * @returns string - Normalized phone number in E.164 format (+221XXXXXXXXX)
 * @throws Error if the input does not contain exactly 9 digits
 * 
 * @example
 * normalizePhone('77 123 45 67') // '+22177123456'
 * normalizePhone('221771234567') // '+22177123456'
 * normalizePhone('00221771234567') // '+22177123456'
 */
export function normalizePhone(input: string): string {
  const digits = nationalPhone(input);
  
  if (digits.length !== 9) {
    throw new Error(`Invalid Senegalese phone number: expected 9 digits, got ${digits.length}`);
  }
  
  return `+221${digits}`;
}

/**
 * RPC response type for get_invite_preview
 */
interface InvitePreviewResponse {
  success: boolean;
  error?: string;
  message?: string;
  collecte_id?: string;
  collecte_title?: string;
  motif?: string;
  amount?: number;
  created_by_name?: string;
  deadline?: string | null;
}

/**
 * Fetch preview information for an invite token.
 * Calls the Supabase RPC function 'get_invite_preview' to retrieve
 * collection details without requiring authentication.
 * 
 * @param token - The invite token to preview
 * @returns Promise<InvitePreviewResponse> - Preview data or error information
 * @throws Error on network or RPC error
 * 
 * @example
 * const preview = await getInvitePreview('abc123...');
 * if (preview.success) {
 *   console.log(`Invited to: ${preview.collecte_title}`);
 * } else {
 *   console.error(preview.message);
 * }
 */
export async function getInvitePreview(token: string): Promise<InvitePreviewResponse> {
  const { data, error } = await supabase.rpc('get_invite_preview', {
    token_input: token,
  });

  if (error) {
    throw new Error(`Failed to fetch invite preview: ${error.message}`);
  }

  return data as InvitePreviewResponse;
}

/**
 * RPC response type for claim_invitation
 */
interface ClaimInviteResponse {
  success: boolean;
  error?: string;
  message: string;
  collecte_id?: string;
}

/**
 * Claim an invitation by providing user details.
 * Normalizes the phone number, then calls the Supabase RPC function 'claim_invitation'
 * to link the current authenticated user to the participant record.
 * 
 * @param token - The invite token to claim
 * @param prenom - User's first name (will be trimmed)
 * @param nom - User's last name (will be trimmed)
 * @param phone - User's Senegalese phone number (will be normalized to E.164)
 * @returns Promise<ClaimInviteResponse> - Result with collecte_id on success or error details
 * @throws Error on network error, RPC error, or invalid phone number
 * 
 * @example
 * const result = await claimInvite('abc123...', 'Fatou', 'Diop', '77 123 45 67');
 * if (result.success) {
 *   console.log(`Joined collecte: ${result.collecte_id}`);
 * } else {
 *   console.error(result.message);
 * }
 */
export async function claimInvite(
  token: string,
  prenom: string,
  nom: string,
  phone: string
): Promise<ClaimInviteResponse> {
  // Normalize phone to E.164 format (throws if invalid)
  const normalizedPhone = normalizePhone(phone);

  const { data, error } = await supabase.rpc('claim_invitation', {
    token_input: token,
    prenom_input: prenom.trim(),
    nom_input: nom.trim(),
    phone_input: normalizedPhone,
  });

  if (error) {
    throw new Error(`Failed to claim invitation: ${error.message}`);
  }

  return data as ClaimInviteResponse;
}
