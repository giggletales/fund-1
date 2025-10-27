import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { to, subject, html, text, type } = await req.json();

    // Use Resend for actual email delivery
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || 're_demo_key';
    
    const emailPayload = {
      from: 'Fund8r <noreply@fund8r.com>',
      to: [to],
      subject: subject,
      html: html,
      text: text
    };

    // Send via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData);
      // Fallback: Log email details for manual review
      console.log('Email that failed to send:', JSON.stringify({
        to, subject, type,
        preview: text.substring(0, 200)
      }, null, 2));
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email service unavailable',
          details: resendData
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Email sent successfully:', {
      emailId: resendData.id,
      to,
      subject,
      type
    });

    return new Response(
      JSON.stringify({
        success: true,
        emailId: resendData.id,
        recipient: to,
        subject: subject
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Email function error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});