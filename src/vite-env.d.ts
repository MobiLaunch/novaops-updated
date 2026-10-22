/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SQUARE_APPLICATION_ID?: string;
  readonly VITE_SQUARE_LOCATION_ID?: string;
  readonly VITE_SQUARE_SANDBOX?: string;
  readonly VITE_EMAILJS_SERVICE_ID?: string;
  readonly VITE_EMAILJS_PUBLIC_KEY?: string;
  readonly VITE_EMAILJS_TEMPLATE_CUSTOMER?: string;
  readonly VITE_SOCIAL_GOOGLE?: string;
  readonly VITE_SOCIAL_FACEBOOK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
