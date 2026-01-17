import { Property, PropertyBasics, PropertyCharacteristics, PropertyImage } from './types';

let cachedProperties: Property[] | null = null;

/**
 * Merges property data from three JSON sources by ID
 * Caches the result to avoid repeated file reads
 * This function should only be called on the server side
 */
export function getAllProperties(): Property[] {
  if (cachedProperties) {
    return cachedProperties;
  }

  try {
    // Import data files directly (works in Next.js API routes)
    const basicsData = require('@/data/property_basics.json') as PropertyBasics[];
    const characteristicsData = require('@/data/property_characteristics.json') as PropertyCharacteristics[];
    const imagesData = require('@/data/property_images.json') as PropertyImage[];
    
    // Create lookup maps for efficient merging
    const characteristicsMap = new Map(
      characteristicsData.map(item => [item.id, item])
    );
    
    const imagesMap = new Map(
      imagesData.map(item => [item.id, item])
    );
    
    // Merge data by ID
    cachedProperties = basicsData.map(basic => {
      const characteristics = characteristicsMap.get(basic.id);
      const image = imagesMap.get(basic.id);
      
      return {
        ...basic,
        bedrooms: characteristics?.bedrooms || 0,
        bathrooms: characteristics?.bathrooms || 0,
        size_sqft: characteristics?.size_sqft || 0,
        amenities: characteristics?.amenities || [],
        image_url: image?.image_url || 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg',
      };
    });
    
    return cachedProperties;
  } catch (error) {
    console.error('Error loading property data:', error);
    return [];
  }
}

/**
 * Parses user input to extract search preferences
 */
export function parseUserPreferences(input: string): {
  location?: string;
  budget?: number;
  bedrooms?: number;
  amenities?: string[];
} {
  const preferences: any = {};
  const lowerInput = input.toLowerCase();
  
  // Extract budget
  const budgetMatch = lowerInput.match(/(?:under|below|less than|up to|max)\s*\$?\s*(\d+(?:,?\d+)*)\s*(?:k|lakhs?|thousand)?/i);
  if (budgetMatch) {
    let amount = parseInt(budgetMatch[1].replace(/,/g, ''));
    if (lowerInput.includes('lakh')) {
      amount *= 100000;
    } else if (lowerInput.includes('k') || lowerInput.includes('thousand')) {
      amount *= 1000;
    }
    preferences.budget = amount;
  }
  
  // Extract bedrooms
  const bedroomMatch = lowerInput.match(/(\d+)\s*(?:bhk|bed|bedroom)/i);
  if (bedroomMatch) {
    preferences.bedrooms = parseInt(bedroomMatch[1]);
  }
  
  // Extract location - look for common city names or location keywords
  const locationKeywords = ['in', 'at', 'near', 'around'];
  for (const keyword of locationKeywords) {
    const regex = new RegExp(`${keyword}\\s+([a-z\\s,]+?)(?:\\s+with|\\s+under|\\s+below|$)`, 'i');
    const match = lowerInput.match(regex);
    if (match) {
      preferences.location = match[1].trim();
      break;
    }
  }
  
  // Extract amenities
  const amenityKeywords = ['parking', 'gym', 'pool', 'swimming pool', 'garden', 'balcony', 'security', 'elevator', 'terrace'];
  const foundAmenities: string[] = [];
  
  for (const amenity of amenityKeywords) {
    if (lowerInput.includes(amenity)) {
      foundAmenities.push(amenity);
    }
  }
  
  if (foundAmenities.length > 0) {
    preferences.amenities = foundAmenities;
  }
  
  return preferences;
}

/**
 * Filters properties based on user preferences
 */
export function filterProperties(
  properties: Property[],
  preferences: {
    location?: string;
    budget?: number;
    bedrooms?: number;
    amenities?: string[];
  }
): Property[] {
  return properties.filter(property => {
    // Filter by budget
    if (preferences.budget && property.price > preferences.budget) {
      return false;
    }
    
    // Filter by location (partial match, case-insensitive)
    if (preferences.location) {
      const locationMatch = property.location
        .toLowerCase()
        .includes(preferences.location.toLowerCase().trim());
      if (!locationMatch) {
        return false;
      }
    }
    
    // Filter by bedrooms
    if (preferences.bedrooms && property.bedrooms !== preferences.bedrooms) {
      return false;
    }
    
    // Filter by amenities (property must have all requested amenities)
    if (preferences.amenities && preferences.amenities.length > 0) {
      const propertyAmenities = property.amenities.map(a => a.toLowerCase());
      const hasAllAmenities = preferences.amenities.every(requested => 
        propertyAmenities.some(available => 
          available.includes(requested.toLowerCase())
        )
      );
      if (!hasAllAmenities) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Ranks properties by relevance (can be enhanced with more sophisticated scoring)
 */
export function rankProperties(properties: Property[]): Property[] {
  return properties.sort((a, b) => {
    // Simple ranking: prefer properties with more amenities
    return b.amenities.length - a.amenities.length;
  });
}

/**
 * Formats price for display
 */
export function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(2)}M`;
  } else if (price >= 1000) {
    return `$${(price / 1000).toFixed(0)}K`;
  }
  return `$${price.toLocaleString()}`;
}
