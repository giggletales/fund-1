import { supabase } from './db';
import { sendWelcomeEmail } from '../services/emailService';

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

  // Send welcome email (don't block signup if email fails)
  sendWelcomeEmail(email, firstName).catch(error => {
    console.error('Failed to send welcome email:', error);
  });

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
