import { supabase } from './db';
import { sendWelcomeEmail } from '../services/emailService';

const API_URL = import.meta.env.VITE_API_URL || 'https://fund-backend-pbde.onrender.com/api';

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  return {
    id: user.id,
    email: user.email,
    first_name: user.user_metadata?.first_name || '',
    last_name: user.user_metadata?.last_name || '',
    email_verified: user.email_confirmed_at !== null
  };
}

export async function signUp(email: string, password: string, firstName: string, lastName: string, country?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName
      }
    }
  });

  // Check if user already exists
  if (error?.message?.includes('already registered')) {
    return { success: false, error: 'User already exists. Please login instead.' };
  }

  if (error || !data.user) {
    return { success: false, error: error?.message || 'Signup failed' };
  }

  // Create user profile with friendly ID
  try {
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        country: country || ''
      });

    if (profileError) {
      console.error('Failed to create user profile:', profileError);
    }
  } catch (profileError) {
    console.error('Error creating user profile:', profileError);
  }

  // Send verification code via backend API
  try {
    console.log('Sending verification code to:', email);
    console.log('API URL:', `${API_URL}/verification/send-code`);
    
    const response = await fetch(`${API_URL}/verification/send-code`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email }),
      mode: 'cors',
      credentials: 'include'
    });
    
    console.log('Verification API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Verification email request failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return { 
        success: false, 
        error: `Failed to send verification email (${response.status}). Please try again.` 
      };
    }
    
    const result = await response.json();
    console.log('Verification API result:', result);
    
    if (!result.success) {
      console.warn('Failed to send verification code:', result.message || result.error);
      return { 
        success: false, 
        error: result.message || 'Failed to send verification email' 
      };
    }
    
    console.log('✅ Verification code sent successfully');
  } catch (error: any) {
    console.error('Error sending verification code:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    return { 
      success: false, 
      error: `Network error: ${error.message}. Please check your connection and try again.` 
    };
  }

  return { success: true, user: data.user };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { success: false, error: error?.message || 'Login failed' };
  }

  return { success: true, user: data.user };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { success: !error, error: error?.message };
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) return null;
  return session;
}
