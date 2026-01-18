# OpenAI NLP Integration - Real Estate Chatbot

## Overview

The chatbot now uses **OpenAI GPT-4o-mini** for natural language understanding and intelligent property matching, replacing the previous regex-based approach.

## Key Features

### 1. **Natural Language Understanding (NLU)**

The chatbot now understands complex queries in natural language:

**Examples:**
- ✅ "I'm looking for a cozy 2 bedroom apartment under $500K in New York with parking"
- ✅ "Show me luxury properties between 800K and 1.2M with pool and gym"
- ✅ "Find me a studio apartment near downtown, budget around 300 thousand"
- ✅ "Need a 3 BHK house in California with garden and security, price range 600K to 800K"

### 2. **Intelligent Preference Extraction**

The system extracts structured data from natural language:

```typescript
interface ExtractedPreferences {
  location?: string;              // "New York", "California", etc.
  budget?: number;                // Single budget value
  minBudget?: number;             // For ranges
  maxBudget?: number;             // For ranges
  bedrooms?: number;              // Exact bedroom count
  minBedrooms?: number;           // For ranges
  maxBedrooms?: number;           // For ranges
  bathrooms?: number;
  propertyType?: string;          // "apartment", "house", "villa", etc.
  amenities?: string[];           // ["parking", "gym", "pool"]
  keywords?: string[];            // Other preferences
  intent?: string;                // "search", "greeting", "compare", etc.
}
```

### 3. **Smart Budget Parsing**

Handles multiple formats automatically:
- "$500K" → 500,000
- "1.2 million" → 1,200,000
- "5 lakh" → 500,000
- "under 800 thousand" → 800,000
- "between 600K and 900K" → minBudget: 600,000, maxBudget: 900,000

### 4. **Fuzzy Matching**

**Location Matching:**
- Query: "New York" matches "Manhattan, New York"
- Query: "Downtown LA" matches "Los Angeles Downtown"

**Amenity Matching with Synonyms:**
- "parking" matches "garage", "car park", "parking space"
- "gym" matches "fitness center", "workout room"
- "pool" matches "swimming pool", "swimming facility"
- "security" matches "24/7 security", "gated community"

### 5. **Intelligent Ranking**

Properties are ranked using a weighted scoring system:

```typescript
Score = 
  + Budget Proximity (30 points)      // Closer to target budget = higher score
  + Bedroom Match (25 points)         // Exact match preferred
  + Amenity Matches (10 points each)  // Each matched amenity
  + Total Amenities (2 points each)   // More amenities = better
  + Size Bonus (up to 10 points)      // Larger properties slightly preferred
```

### 6. **Natural Conversational Responses**

The chatbot generates human-like responses:

**Before (Regex-based):**
> "I found 5 properties matching 2 bedrooms under $500K in New York with parking. Check them out below!"

**After (OpenAI NLP):**
> "Great! I found 5 beautiful 2-bedroom apartments in New York with parking, all within your $500K budget. Let me show you the best matches! 🏠"

### 7. **Intent Recognition**

The system recognizes different types of user intents:
- **Greeting**: "Hi", "Hello", "Hey there"
- **Search**: Property search queries
- **Browse**: General browsing without specific criteria
- **Compare**: Comparing properties
- **Get Details**: Asking about specific property details

## Technical Implementation

### File Structure

```
lib/
  ├── openai.ts              # OpenAI integration & NLP functions
  └── propertyUtils.ts       # Enhanced filtering & ranking

app/api/
  └── chat/
      └── route.ts           # Updated to use OpenAI NLP
```

### Key Functions

#### 1. `extractPropertyPreferences(userMessage: string)`
- Uses GPT-4o-mini to extract structured preferences
- Returns JSON with all preference fields
- Handles greetings, ranges, and complex queries

#### 2. `generateNaturalResponse(userMessage, preferences, matchCount)`
- Generates conversational responses
- Contextually aware
- Warm and professional tone

#### 3. `filterPropertiesNLP(properties, preferences)`
- Filters properties using NLP-extracted preferences
- Supports budget/bedroom ranges
- Fuzzy location matching
- Flexible amenity matching (70% threshold)

#### 4. `rankPropertiesNLP(properties, preferences)`
- Multi-factor weighted scoring
- Budget proximity prioritization
- Exact bedroom match bonus
- Amenity relevance scoring

## Configuration

Ensure your `.env` file has the OpenAI API key:

```env
OPENAI_API_KEY=sk-proj-...
```

## API Usage

### Request
```json
POST /api/chat
{
  "message": "Find me a 2 bedroom apartment under 500K in New York with parking and gym"
}
```

### Response
```json
{
  "message": "I found 5 great apartments matching your criteria! All are 2-bedroom with parking and gym in New York, within your $500K budget. 🏠",
  "properties": [...],
  "preferences": {
    "location": "New York",
    "budget": 500000,
    "bedrooms": 2,
    "amenities": ["parking", "gym"],
    "intent": "search"
  }
}
```

## Benefits Over Regex Approach

| Feature | Regex-Based | OpenAI NLP |
|---------|-------------|------------|
| Understanding | Limited patterns | Natural language |
| Flexibility | Strict matching | Fuzzy matching |
| Ranges | Not supported | Fully supported |
| Synonyms | Manual mapping | Automatic |
| Responses | Template-based | Conversational |
| Intent | Basic | Context-aware |
| Budget Formats | Limited | All formats |

## Testing Examples

Try these queries to see the NLP in action:

1. **Simple Query:**
   - "Show me 2 bedroom apartments"
   
2. **Budget Range:**
   - "Properties between 500K and 800K"
   
3. **Complex Query:**
   - "I need a spacious 3 bedroom house in Miami with pool, gym, and parking, budget around 1 million"
   
4. **Casual Language:**
   - "Looking for something cozy with 2 beds, not too expensive, maybe around 400K?"
   
5. **Multiple Amenities:**
   - "Find properties with pool, garden, security, and elevator"

## Performance

- **Response Time:** ~2-3 seconds (includes OpenAI API call)
- **Model:** GPT-4o-mini (fast and cost-effective)
- **Cost:** ~$0.0001 per query (very affordable)
- **Accuracy:** Significantly improved over regex patterns

## Future Enhancements

Potential improvements:
- [ ] Conversation history for context-aware multi-turn dialogues
- [ ] Property comparison suggestions
- [ ] Personalized recommendations based on user history
- [ ] Image-based property search
- [ ] Voice input integration
- [ ] Multi-language support

## Troubleshooting

**Issue:** OpenAI API errors
- **Solution:** Check API key in `.env` file
- **Fallback:** System uses basic regex parsing if OpenAI fails

**Issue:** Slow responses
- **Solution:** Consider caching common queries
- **Alternative:** Use smaller model (already using gpt-4o-mini)

**Issue:** Incorrect preference extraction
- **Solution:** Check prompt in `lib/openai.ts` and adjust system message

---

**Powered by OpenAI GPT-4o-mini** 🤖
