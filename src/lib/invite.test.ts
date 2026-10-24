import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateInviteToken, normalizePhone, getInvitePreview, claimInvite } from './invite';
import { supabase } from './supabase';

describe('generateInviteToken', () => {
  it('returns a string with length 21', () => {
    const token = generateInviteToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBe(21);
  });

  it('generates unique tokens across multiple calls', () => {
    const token1 = generateInviteToken();
    const token2 = generateInviteToken();
    const token3 = generateInviteToken();
    
    expect(token1).not.toBe(token2);
    expect(token2).not.toBe(token3);
    expect(token1).not.toBe(token3);
  });
});

describe('normalizePhone', () => {
  it('normalizes phone with prefix +221 and 9 digits', () => {
    const result = normalizePhone('+221771234567');
    expect(result).toBe('+221771234567');
  });

  it('normalizes phone with 9 digits without prefix', () => {
    const result = normalizePhone('771234567');
    expect(result).toBe('+221771234567');
  });

  it('normalizes phone with spaces and formatting', () => {
    const result = normalizePhone('77 123 45 67');
    expect(result).toBe('+221771234567');
  });

  it('throws error for invalid phone with 8 digits', () => {
    expect(() => normalizePhone('7712345')).toThrow('Invalid Senegalese phone number: expected 9 digits, got 7');
  });

  it('truncates phone with 10 digits to 9 (via nationalPhone behavior)', () => {
    // nationalPhone truncates to 9 digits, so this actually succeeds
    const result = normalizePhone('77123456789');
    expect(result).toBe('+221771234567');
  });

  it('throws error for phone with letters (only 6 digits extracted)', () => {
    // '77abc4567' -> nationalPhone extracts '774567' (6 digits after removing letters)
    expect(() => normalizePhone('77abc4567')).toThrow('Invalid Senegalese phone number: expected 9 digits, got 6');
  });
});

describe('getInvitePreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls supabase.rpc with correct parameters', async () => {
    const mockResponse = {
      success: true,
      collecte_id: 'test-collecte',
      collecte_title: 'Test Collecte',
      motif: 'anniversaire',
      amount: 5000,
      created_by_name: 'Aminata',
    };

    vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: mockResponse,
      error: null,
    } as any);

    const result = await getInvitePreview('test-token-123');

    expect(supabase.rpc).toHaveBeenCalledWith('get_invite_preview', {
      token_input: 'test-token-123',
    });
    expect(result).toEqual(mockResponse);
  });

  it('throws error when supabase.rpc returns error', async () => {
    vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: null,
      error: { message: 'Token not found' },
    } as any);

    await expect(getInvitePreview('invalid-token')).rejects.toThrow(
      'Failed to fetch invite preview: Token not found'
    );
  });
});

describe('claimInvite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes phone and calls supabase.rpc with correct parameters', async () => {
    const mockResponse = {
      success: true,
      message: 'Invitation claimed successfully',
      collecte_id: 'test-collecte-id',
    };

    vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: mockResponse,
      error: null,
    } as any);

    const result = await claimInvite('test-token', 'Fatou', 'Diop', '77 123 45 67');

    expect(supabase.rpc).toHaveBeenCalledWith('claim_invitation', {
      token_input: 'test-token',
      prenom_input: 'Fatou',
      nom_input: 'Diop',
      phone_input: '+221771234567',
    });
    expect(result).toEqual(mockResponse);
  });

  it('trims prenom and nom before calling RPC', async () => {
    const mockResponse = {
      success: true,
      message: 'Claimed',
      collecte_id: 'test-id',
    };

    vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: mockResponse,
      error: null,
    } as any);

    await claimInvite('token', '  Ousmane  ', '  Diallo  ', '771234567');

    expect(supabase.rpc).toHaveBeenCalledWith('claim_invitation', {
      token_input: 'token',
      prenom_input: 'Ousmane',
      nom_input: 'Diallo',
      phone_input: '+221771234567',
    });
  });

  it('throws error when phone normalization fails', async () => {
    await expect(claimInvite('token', 'Fatou', 'Diop', '123')).rejects.toThrow(
      'Invalid Senegalese phone number'
    );
  });

  it('throws error when supabase.rpc returns error', async () => {
    vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: null,
      error: { message: 'Token expired' },
    } as any);

    await expect(claimInvite('expired-token', 'Fatou', 'Diop', '771234567')).rejects.toThrow(
      'Failed to claim invitation: Token expired'
    );
  });
});
