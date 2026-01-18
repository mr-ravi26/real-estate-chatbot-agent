import { Property, PropertyBasics, PropertyCharacteristics, PropertyImage } from './types';
import { ExtractedPreferences } from './nlp';

let cachedProperties: Property[] | null = null;

/**
 * Fallback regex-based preference parser (used when OpenAI is unavailable)
 */
export function parseUserPreferencesRegex(input: string): ExtractedPreferences {
  const preferences: ExtractedPreferences = {};
  const lowerInput = input.toLowerCase();
  
  // Extract budget
  const budgetMatch = lowerInput.match(/(?:under|below|less than|up to|max)\s*\$?\s*(\d+(?:,?\d+)*)\s*(?:k|lakhs?|thousand|million|m)?/i);
  if (budgetMatch) {
    let amount = parseInt(budgetMatch[1].replace(/,/g, ''));
    if (lowerInput.includes('lakh')) {
      amount *= 100000;
    } else if (lowerInput.includes('k') || lowerInput.includes('thousand')) {
      amount *= 1000;
    } else if (lowerInput.includes('m') || lowerInput.includes('million')) {
      amount *= 1000000;
    }
    preferences.budget = amount;
  }
  
  // Extract budget range
  const rangeMatch = lowerInput.match(/(?:between|from)\s*\$?\s*(\d+(?:,?\d+)*)\s*(?:k|thousand)?\s*(?:and|to|-)\s*\$?\s*(\d+(?:,?\d+)*)\s*(?:k|thousand)?/i);
  if (rangeMatch) {
    let min = parseInt(rangeMatch[1].replace(/,/g, ''));
    let max = parseInt(rangeMatch[2].replace(/,/g, ''));
    if (lowerInput.includes('k') || lowerInput.includes('thousand')) {
      min *= 1000;
      max *= 1000;
    }
    preferences.minBudget = min;
    preferences.maxBudget = max;
  }
  
  // Extract bedrooms
  const bedroomMatch = lowerInput.match(/(\d+)\s*(?:bhk|bed|bedroom)/i);
  if (bedroomMatch) {
    preferences.bedrooms = parseInt(bedroomMatch[1]);
  }
  
  // Extract location
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
  
  // Detect intent
  if (/^(hi|hello|hey|greetings)/i.test(input.trim())) {
    preferences.intent = 'greeting';
  } else {
    preferences.intent = 'search';
  }
  
  return preferences;
}

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

/**
 * Enhanced filter using NLP-extracted preferences
 * Supports ranges, fuzzy matching, and intelligent amenity matching
 */
export function filterPropertiesNLP(
  properties: Property[],
  preferences: ExtractedPreferences
): Property[] {
  return properties.filter(property => {
    // Filter by budget range
    if (preferences.minBudget && property.price < preferences.minBudget) {
      return false;
    }
    if (preferences.maxBudget && property.price > preferences.maxBudget) {
      return false;
    }
    // Single budget value (treat as max)
    if (preferences.budget && property.price > preferences.budget) {
      return false;
    }
    
    // Filter by location with fuzzy matching
    if (preferences.location) {
      const locationLower = preferences.location.toLowerCase();
      const propertyLocationLower = property.location.toLowerCase();
      
      // Split location into parts for better matching
      const searchTerms = locationLower.split(/[\s,]+/);
      const hasMatch = searchTerms.some(term => 
        term.length > 2 && propertyLocationLower.includes(term)
      );
      
      if (!hasMatch) {
        return false;
      }
    }
    
    // Filter by bedroom range
    if (preferences.minBedrooms && property.bedrooms < preferences.minBedrooms) {
      return false;
    }
    if (preferences.maxBedrooms && property.bedrooms > preferences.maxBedrooms) {
      return false;
    }
    // Exact bedroom match
    if (preferences.bedrooms && property.bedrooms !== preferences.bedrooms) {
      return false;
    }
    
    // Filter by bathrooms
    if (preferences.bathrooms && property.bathrooms < preferences.bathrooms) {
      return false;
    }
    
    // Filter by property type
    if (preferences.propertyType) {
      const propertyType = preferences.propertyType.toLowerCase();
      const propertyTitle = property.title.toLowerCase();
      const propertyDesc = property.description?.toLowerCase() || '';
      
      const typeMatch = propertyTitle.includes(propertyType) || 
                       propertyDesc.includes(propertyType);
      
      if (!typeMatch) {
        return false;
      }
    }
    
    // Intelligent amenity matching with fuzzy search
    if (preferences.amenities && preferences.amenities.length > 0) {
      const propertyAmenities = property.amenities.map(a => a.toLowerCase());
      
      const matchedAmenities = preferences.amenities.filter(requested => {
        const requestedLower = requested.toLowerCase();
        return propertyAmenities.some(available => {
          // Direct substring match
          if (available.includes(requestedLower) || requestedLower.includes(available)) {
            return true;
          }
          
          // Synonym matching
          const synonyms: Record<string, string[]> = {
            'parking': ['garage', 'car park', 'parking space'],
            'gym': ['fitness', 'workout', 'exercise'],
            'pool': ['swimming', 'swimming pool'],
            'security': ['gated', 'guard', '24/7 security'],
            'garden': ['lawn', 'yard', 'outdoor space'],
          };
          
          for (const [key, values] of Object.entries(synonyms)) {
            if (requestedLower === key) {
              return values.some(syn => available.includes(syn));
            }
            if (values.includes(requestedLower)) {
              return available.includes(key);
            }
          }
          
          return false;
        });
      });
      
      // Require at least 70% of amenities to match (flexible matching)
      const matchRatio = matchedAmenities.length / preferences.amenities.length;
      if (matchRatio < 0.7) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Intelligent ranking using NLP preferences
 * Considers multiple factors with weighted scoring
 */
export function rankPropertiesNLP(
  properties: Property[],
  preferences: ExtractedPreferences
): Property[] {
  return properties.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    
    // Budget proximity score (higher weight for closer to budget)
    const targetBudget = preferences.budget || preferences.maxBudget;
    if (targetBudget) {
      const budgetDistanceA = Math.abs(a.price - targetBudget) / targetBudget;
      const budgetDistanceB = Math.abs(b.price - targetBudget) / targetBudget;
      
      scoreA += (1 - Math.min(budgetDistanceA, 1)) * 30; // 30 points max
      scoreB += (1 - Math.min(budgetDistanceB, 1)) * 30;
    }
    
    // Bedroom match score
    const targetBedrooms = preferences.bedrooms || preferences.maxBedrooms;
    if (targetBedrooms) {
      if (a.bedrooms === targetBedrooms) scoreA += 25;
      if (b.bedrooms === targetBedrooms) scoreB += 25;
    }
    
    // Amenity match score
    if (preferences.amenities && preferences.amenities.length > 0) {
      const amenitiesMatchA = countAmenityMatches(a.amenities, preferences.amenities);
      const amenitiesMatchB = countAmenityMatches(b.amenities, preferences.amenities);
      
      scoreA += amenitiesMatchA * 10; // 10 points per matched amenity
      scoreB += amenitiesMatchB * 10;
    }
    
    // Total amenities bonus (properties with more amenities rank higher)
    scoreA += a.amenities.length * 2;
    scoreB += b.amenities.length * 2;
    
    // Size score (larger properties get slight bonus)
    if (a.size_sqft && b.size_sqft) {
      scoreA += Math.min(a.size_sqft / 500, 10); // Cap at 10 points
      scoreB += Math.min(b.size_sqft / 500, 10);
    }
    
    return scoreB - scoreA; // Higher score first
  });
}

/**
 * Helper function to count matching amenities with fuzzy matching
 */
function countAmenityMatches(propertyAmenities: string[], requestedAmenities: string[]): number {
  const propertyAmenitiesLower = propertyAmenities.map(a => a.toLowerCase());
  
  return requestedAmenities.filter(requested => {
    const requestedLower = requested.toLowerCase();
    return propertyAmenitiesLower.some(available => 
      available.includes(requestedLower) || requestedLower.includes(available)
    );
  }).length;
}

