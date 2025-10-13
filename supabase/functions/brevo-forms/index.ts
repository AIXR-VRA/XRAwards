import { serve } from 'https://deno.land/std@0.204.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import * as Sentry from 'https://esm.sh/@sentry/deno@7.91.0';

// Initialize Sentry if environment variables are set
const SENTRY_DSN = Deno.env.get('SENTRY_DSN');
const ENVIRONMENT = Deno.env.get('ENVIRONMENT');
if (SENTRY_DSN && ENVIRONMENT) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    tracesSampleRate: 1.0
  });
} else {
  console.log('Skipping Sentry initialization: Missing required environment variables');
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Brevo List IDs
const BREVO_LIST_IDS = {
  DOWNLOAD_ENTRY_KIT: 9,
  REGISTER_INTEREST_AWARDS_OPTIN: 10
};

// User-facing error messages
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Please sign in to continue',
  INVALID_TOKEN: 'Your session has expired. Please sign in again',
  INVALID_REQUEST: 'Invalid request format',
  MISSING_EMAIL: 'Email is required',
  MISSING_FIRST_NAME: 'First name is required',
  MISSING_LAST_NAME: 'Last name is required',
  MISSING_PHONE: 'Phone number is required',
  INVALID_EMAIL: 'Please provide a valid email address',
  INVALID_PHONE: 'Please provide a valid phone number with country code (e.g., +1234567890)',
  GENERAL_ERROR: 'Unable to process your request. Please try again later'
};

// Simple validation functions - let browser handle the heavy lifting
function isValidEmail(email: string): boolean {
  return email && email.includes('@') && email.includes('.');
}

function isValidPhone(phone: string): boolean {
  return phone && phone.length >= 10;
}

async function addContactToList(contact, listId) {
  const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
  if (!BREVO_API_KEY) {
    const error = new Error(ERROR_MESSAGES.GENERAL_ERROR);
    Sentry.captureException(error, {
      tags: {
        function: 'addContactToList'
      },
      extra: {
        reason: 'Missing BREVO_API_KEY'
      }
    });
    throw error;
  }

  try {
    const createContactResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        email: contact.email,
        attributes: {
          ...contact.firstName && {
            FIRSTNAME: contact.firstName
          },
          ...contact.lastName && {
            LASTNAME: contact.lastName
          },
          ...contact.phone && {
            SMS: contact.phone
          }
        },
        listIds: [listId],
        updateEnabled: true
      })
    });

    if (!createContactResponse.ok && createContactResponse.status !== 201) {
      const errorData = await createContactResponse.json().catch(() => ({
        message: 'Failed to parse error response'
      }));
      console.error('Brevo API error:', {
        status: createContactResponse.status,
        error: errorData
      });
      throw new Error(ERROR_MESSAGES.GENERAL_ERROR);
    }
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        function: 'addContactToList'
      },
      extra: {
        contact: {
          ...contact,
          email: '[REDACTED]'
        }
      }
    });
    console.error('Brevo API error:', error);
    throw new Error(ERROR_MESSAGES.GENERAL_ERROR);
  }
}

async function handleEntryKitDownload(contact) {
  // Validate required fields
  if (!contact.email) {
    throw new Error(ERROR_MESSAGES.MISSING_EMAIL);
  }
  if (!contact.firstName) {
    throw new Error(ERROR_MESSAGES.MISSING_FIRST_NAME);
  }
  if (!contact.lastName) {
    throw new Error(ERROR_MESSAGES.MISSING_LAST_NAME);
  }
  if (!contact.phone) {
    throw new Error(ERROR_MESSAGES.MISSING_PHONE);
  }

  // Validate email format
  if (!isValidEmail(contact.email)) {
    throw new Error(ERROR_MESSAGES.INVALID_EMAIL);
  }

  // Validate phone format
  if (!isValidPhone(contact.phone)) {
    throw new Error(ERROR_MESSAGES.INVALID_PHONE);
  }

  try {
    await addContactToList(contact, BREVO_LIST_IDS.DOWNLOAD_ENTRY_KIT);
    return true;
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        function: 'handleEntryKitDownload'
      },
      extra: {
        contact: {
          ...contact,
          email: '[REDACTED]'
        }
      }
    });
    console.error('Failed to add contact to entry kit list:', error);
    throw new Error(ERROR_MESSAGES.GENERAL_ERROR);
  }
}

async function handleRegisterInterest(contact) {
  // Validate required fields
  if (!contact.email) {
    throw new Error(ERROR_MESSAGES.MISSING_EMAIL);
  }

  // Validate email format
  if (!isValidEmail(contact.email)) {
    throw new Error(ERROR_MESSAGES.INVALID_EMAIL);
  }

  try {
    await addContactToList(contact, BREVO_LIST_IDS.REGISTER_INTEREST_AWARDS_OPTIN);
    return true;
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        function: 'handleRegisterInterest'
      },
      extra: {
        contact: {
          ...contact,
          email: '[REDACTED]'
        }
      }
    });
    console.error('Failed to add contact to register interest list:', error);
    throw new Error(ERROR_MESSAGES.GENERAL_ERROR);
  }
}

serve(async (req) => {
  let transaction;
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: corsHeaders
      });
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        success: false,
        error: ERROR_MESSAGES.INVALID_REQUEST
      }), {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Parse request body
    const body = await req.json();
    const { type, firstName, lastName, email, phone } = body;

    // Validate request type
    if (!type || (type !== 'entry_kit' && type !== 'register_interest')) {
      return new Response(JSON.stringify({
        success: false,
        error: ERROR_MESSAGES.INVALID_REQUEST
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Create contact object
    const contact = {
      email: email?.trim().toLowerCase(),
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      phone: phone?.trim()
    };

    // Handle different types of requests
    if (type === 'entry_kit') {
      await handleEntryKitDownload(contact);
    } else if (type === 'register_interest') {
      await handleRegisterInterest(contact);
    }

    return new Response(JSON.stringify({
      success: true,
      message: type === 'entry_kit' 
        ? 'Entry kit download request submitted successfully' 
        : 'Interest registration submitted successfully'
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    Sentry.captureException(error);
    console.error('Error in brevo-forms function:', error);
    const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL_ERROR;
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: error instanceof Error && error.message === ERROR_MESSAGES.UNAUTHORIZED ? 401 : 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
