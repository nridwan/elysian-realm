import Elysia from "elysia";
import { config } from "../config/config";

// Import translation files
import enTranslations from "../localization/en";
import idTranslations from "../localization/id";

// Define the structure for translations
interface Translations {
  [key: string]: string | Translations;
}

// Define available languages
const translations: Record<string, Translations> = {
  en: enTranslations,
  id: idTranslations,
};

// Define the localization tools interface
export interface LocalizationTools {
  language: string;
  getTranslation: (key: string, params?: Record<string, any>, language?: string | null) => string;
}

// Helper function to get nested property from object
function getNestedProperty(obj: Translations, key: string): string | undefined {
  const keys = key.split('.');
  let current: string | Translations | undefined = obj;
  
  for (const k of keys) {
    if (typeof current === 'object' && current !== null && k in current) {
      current = (current as Translations)[k];
    } else {
      return undefined;
    }
  }
  
  return typeof current === 'string' ? current : undefined;
}

// Helper function to replace placeholders in translation strings
function replacePlaceholders(template: string, params: Record<string, any> = {}): string {
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }
  return result;
}

export const localizationPlugin = () => (app: Elysia) =>
  app.derive(({ headers }) => {
    // Get language from X-Language header or fallback to default
    const language = headers['x-language'] || config.localization.defaultLanguage || 'en';
    
    const localizationTools: LocalizationTools = {
      language,
      
      getTranslation(key: string, params?: Record<string, any>, languageOverride: string | null = null): string {
        // Use provided language or fallback to instance language
        const lang = languageOverride || this.language;
        
        // Get translations for the language or fallback to English
        const langTranslations = translations[lang] || translations[config.localization.defaultLanguage || 'en'] || translations['en'];
        
        // Get the translation string
        const translation = getNestedProperty(langTranslations, key);
        
        // If translation not found, return the key
        if (translation === undefined) {
          return key;
        }
        
        // Replace placeholders if params are provided
        return replacePlaceholders(translation, params);
      }
    };
    
    return { localizationTools };
  });