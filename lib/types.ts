export interface PropertyBasics {
  id: number;
  title: string;
  price: number;
  location: string;
}

export interface PropertyCharacteristics {
  id: number;
  bedrooms: number;
  bathrooms: number;
  size_sqft: number;
  amenities: string[];
}

export interface PropertyImage {
  id: number;
  image_url: string;
}

export interface Property {
  id: number;
  title: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  size_sqft: number;
  amenities: string[];
  image_url: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  properties?: Property[];
  timestamp: Date;
}

export interface UserPreferences {
  location?: string;
  budget?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
}

export interface SavedProperty {
  userSessionId: string;
  propertyId: number;
  savedAt: Date;
}
