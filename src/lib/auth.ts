import { supabase } from './db';
import { sendWelcomeEmail } from '../services/emailService';

<<<<<<< HEAD
=======
// API URL configuration
// In development: uses Vite proxy (/api -> http://localhost:5000)
// In production: must set VITE_API_URL environment variable
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://fund-backend-pbde.onrender.com/api');

>>>>>>> email-verification
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

<<<<<<< HEAD
=======
  // Check if user already exists
  if (error?.message?.includes('already registered')) {
    return { success: false, error: 'User already exists. Please login instead.' };
  }

>>>>>>> email-verification
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

<<<<<<< HEAD
  // Send welcome email (don't block signup if email fails)
  sendWelcomeEmail(email, firstName).catch(error => {
    console.error('Failed to send welcome email:', error);
  });
=======
  // Send verification code via backend API
  try {
    const response = await fetch(`${API_URL}/verification/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    if (!response.ok) {
      console.warn('Verification email request failed:', response.status, response.statusText);
      return { success: false, error: 'Failed to send verification email. Please try again.' };
    }
    
    const result = await response.json();
    if (!result.success) {
      console.warn('Failed to send verification code:', result.message || result.error);
      return { success: false, error: result.message || 'Failed to send verification email' };
    }
    
    console.log('Verification code sent successfully');
  } catch (error) {
    console.error('Error sending verification code:', error);
    return { success: false, error: 'Error sending confirmation email' };
  }
>>>>>>> email-verification

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
