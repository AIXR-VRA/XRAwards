import type { CookieConsentConfig } from "vanilla-cookieconsent";

// Extend the Window interface to include the dataLayer object
declare global {
  interface Window {
    dataLayer: Record<string, any>[];
    gtag: (...args: any[]) => void;
  }
}

export const config: CookieConsentConfig = {
  root: "#cc-container",
  
  guiOptions: {
    consentModal: {
      layout: "box",
      position: "bottom center",
      equalWeightButtons: false,
      flipButtons: false,
    },
  },

  categories: {
    necessary: {
      enabled: true,
      readOnly: true,
    },
    analytics: {
      enabled: false,
      autoClear: {
        cookies: [
          { name: /^_ga/ },
          { name: "_gid" },
        ],
      },
    },
  },

  language: {
    default: "en",
    translations: {
      en: {
        consentModal: {
          title: "We use cookies",
          description:
            'We use cookies to enhance site navigation, analyze site usage, and assist in our marketing efforts. You can also <a href="#" data-cc="accept-necessary" class="cc-link">reject non-essential cookies</a>. View our <a href="/legal/privacy-policy/" class="cc-link">Privacy Policy</a> for more information.',
          acceptAllBtn: "Accept All Cookies",
        },
        preferencesModal: {
          title: "Cookie Preferences",
          acceptAllBtn: "Accept All",
          acceptNecessaryBtn: "Reject All",
          savePreferencesBtn: "Save",
          sections: [
            {
              title: "Necessary Cookies",
              description: "Essential for the website to function.",
              linkedCategory: "necessary",
            },
            {
              title: "Analytics Cookies",
              description: "Help us understand how visitors use our site.",
              linkedCategory: "analytics",
            },
          ],
        },
      },
    },
  },

  onConsent: ({ cookie }) => {
    if (cookie.categories.includes("analytics")) {
      // Update consent to granted for GA4
      if (typeof window.gtag === "function") {
        window.gtag("consent", "update", {
          ad_storage: "granted",
          ad_user_data: "granted",
          ad_personalization: "granted",
          analytics_storage: "granted",
        });
      }
    }
  },

  onChange: ({ cookie }) => {
    if (typeof window.gtag === "function") {
      if (cookie.categories.includes("analytics")) {
        window.gtag("consent", "update", {
          ad_storage: "granted",
          ad_user_data: "granted",
          ad_personalization: "granted",
          analytics_storage: "granted",
        });
      } else {
        window.gtag("consent", "update", {
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
          analytics_storage: "denied",
        });
      }
    }
  },
};

