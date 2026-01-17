# Agent Mira - Technical Architecture

## System Overview

Agent Mira is a full-stack real estate chatbot application built with Next.js 14, featuring intelligent property matching through natural language processing and a premium Next-Zen UI.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                         │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Chat UI    │  │ Property     │  │ Favorites        │   │
│  │ Interface  │  │ Cards        │  │ Management       │   │
│  └────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js API Routes                         │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ /api/chat  │  │ /api/save-   │  │ Property Utils   │   │
│  │            │  │ property     │  │ (Data Layer)     │   │
│  └────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌─────────────────────┐         ┌─────────────────────┐
│   JSON Data Files   │         │   MongoDB Atlas     │
│  • property_basics  │         │  • savedProperties  │
│  • characteristics  │         │    collection       │
│  • images           │         │                     │
└─────────────────────┘         └─────────────────────┘
```

## Data Flow

### 1. Property Search Flow

```
User Input
    ↓
Natural Language Parsing (propertyUtils.ts)
    ↓
Extract Preferences (budget, location, bedrooms, amenities)
    ↓
Filter Properties (getAllProperties → filterProperties)
    ↓
Rank Results (rankProperties)
    ↓
Return to Client (max 12 properties)
    ↓
Display as Property Cards
```

### 2. Save/Favorite Flow

```
User Clicks Heart Icon
    ↓
POST /api/save-property
    ↓
MongoDB Atlas Insert/Delete
    ↓
Update Client State
    ↓
Visual Feedback (filled heart)
```

## Component Architecture

### Core Components

#### ChatInterface.tsx
- **Purpose**: Main orchestrator component
- **State Management**:
  - `messages`: Array of chat messages
  - `input`: Current user input
  - `isTyping`: Loading state
  - `sessionId`: Unique user session identifier
  - `savedProperties`: Set of saved property IDs
- **Key Features**:
  - Auto-scrolling to latest message
  - Quick prompt suggestions
  - Real-time typing indicator
  - Session-based persistence

#### PropertyCard.tsx
- **Purpose**: Individual property display
- **Features**:
  - Image with hover zoom effect
  - Price formatting
  - Bedroom/bathroom/sqft stats
  - Amenity tags
  - Save/unsave functionality
  - "View Details" CTA

#### TypingIndicator.tsx
- **Purpose**: Visual feedback during API calls
- **Animation**: Three bouncing dots with staggered delays

### UI Components (shadcn/ui inspired)

- **Button**: 4 variants, 4 sizes, full accessibility
- **Input**: Consistent styling with focus states
- **Card**: Flexible container with header/content/footer

## Data Layer

### Property Data Merging

```typescript
// Three separate JSON files merged by ID
property_basics.json        → id, title, price, location
property_characteristics.json → id, bedrooms, bathrooms, size_sqft, amenities
property_images.json        → id, image_url

// Merged Result (Property interface)
{
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
```

### Caching Strategy

- **Location**: Server memory (Node.js process)
- **Trigger**: First API call to `/api/chat`
- **Invalidation**: Server restart (suitable for MVP)
- **Future**: Redis/Memcached for multi-instance deployments

### Natural Language Processing

#### Pattern Matching Regex

1. **Budget Extraction**
   - Pattern: `under|below|less than|up to|max \d+ (k|lakhs?|thousand)?`
   - Example: "under 80 lakhs" → 8000000
   - Handles: K, lakhs, thousand, raw numbers

2. **Bedroom Extraction**
   - Pattern: `\d+ (bhk|bed|bedroom)`
   - Example: "2 BHK" → 2
   - Handles: BHK, bed, bedroom variants

3. **Location Extraction**
   - Pattern: `in|at|near|around [location text]`
   - Example: "in Miami" → "Miami"
   - Partial matching in filter

4. **Amenity Extraction**
   - Keywords: parking, gym, pool, garden, balcony, security, elevator, terrace
   - Case-insensitive substring matching

### Filtering Logic

```typescript
filterProperties(properties, preferences) {
  return properties.filter(property => {
    // Budget: price ≤ user budget
    if (budget && property.price > budget) return false;
    
    // Location: case-insensitive partial match
    if (location && !property.location.toLowerCase().includes(location.toLowerCase())) 
      return false;
    
    // Bedrooms: exact match
    if (bedrooms && property.bedrooms !== bedrooms) return false;
    
    // Amenities: property must have ALL requested amenities
    if (amenities && !amenities.every(req => 
      property.amenities.some(avail => avail.toLowerCase().includes(req.toLowerCase()))
    )) return false;
    
    return true;
  });
}
```

### Ranking Algorithm (v1)

Current: Sort by number of amenities (descending)

**Future Enhancements**:
- Price-to-value ratio
- Recency of listing
- User preference learning
- Location desirability score
- Image quality score

## API Design

### POST /api/chat

**Request Body**:
```json
{
  "message": "string - user's natural language query"
}
```

**Response**:
```json
{
  "message": "string - AI-generated response",
  "properties": "Property[] - matched properties (max 12)",
  "preferences": "UserPreferences - extracted filters"
}
```

**Error Handling**:
- 400: Invalid request (missing message)
- 500: Server error (logged to console)

### POST /api/save-property

**Request Body**:
```json
{
  "propertyId": "number",
  "userSessionId": "string"
}
```

**Response**:
```json
{
  "message": "string",
  "saved": "boolean"
}
```

### GET /api/save-property

**Query Params**: `?sessionId=string`

**Response**:
```json
{
  "savedProperties": "number[] - array of property IDs"
}
```

### DELETE /api/save-property

**Request Body**:
```json
{
  "propertyId": "number",
  "userSessionId": "string"
}
```

## Database Schema

### MongoDB Collection: savedProperties

```typescript
{
  _id: ObjectId,               // Auto-generated by MongoDB
  userSessionId: string,        // Client-generated session ID
  propertyId: number,           // Property ID from JSON data
  savedAt: Date                 // Timestamp of save action
}
```

**Indexes** (recommended for production):
```javascript
db.savedProperties.createIndex({ userSessionId: 1, propertyId: 1 }, { unique: true });
db.savedProperties.createIndex({ savedAt: -1 });
```

## Styling System

### Tailwind Configuration

#### Color Palette (Dark Theme)
```css
--background: 240 10% 3.9%      /* #0A0A0B */
--foreground: 0 0% 98%          /* #FAFAFA */
--primary: 0 0% 98%             /* White text */
--card: 240 10% 5%              /* #0D0D0F */
--muted: 240 3.7% 15.9%         /* #242426 */
--border: 240 3.7% 15.9%        /* Subtle borders */
```

#### Animation Keyframes
- **fade-in**: Opacity 0→1, translateY 10px→0
- **slide-in**: TranslateX -100%→0
- **shimmer**: Background position animation

### CSS Custom Properties

Used for theme consistency and easy customization:
- `--radius`: Border radius (0.5rem default)
- All colors use HSL format for easy manipulation

## Performance Optimizations

### 1. Image Optimization
- Next.js Image component with automatic optimization
- Lazy loading below the fold
- Blur placeholder (optional)

### 2. Code Splitting
- Automatic route-based splitting by Next.js
- Dynamic imports for heavy components (future)

### 3. Data Fetching
- Server-side data merging (no client-side processing)
- In-memory caching of merged data
- Limited results (12 properties max per response)

### 4. Bundle Size
- Tree-shaking with ES modules
- No heavy dependencies (Framer Motion optional)
- Total First Load JS: ~105 KB

## Security Considerations

### 1. Environment Variables
- MongoDB URI never exposed to client
- Vercel environment variables encrypted at rest

### 2. API Rate Limiting (TODO)
- Implement rate limiting for production
- Recommended: 60 requests/minute per IP

### 3. Input Validation
- All API endpoints validate required fields
- MongoDB queries use parameterized inputs (no injection risk)

### 4. Session Management
- Client-generated session IDs (UUID-like)
- No PII stored (stateless sessions)
- Consider JWT tokens for production with user auth

## Deployment Pipeline

### Vercel Deployment

1. **Build Process**:
   ```bash
   npm install → npm run build → Deploy
   ```

2. **Environment Variables**:
   - Set in Vercel dashboard
   - Automatically injected at build time

3. **Automatic Deployments**:
   - Every push to `main` → production
   - Pull requests → preview deployments

4. **Edge Network**:
   - Global CDN for static assets
   - Serverless functions for API routes
   - Cold start: ~100-200ms

## Testing Strategy (Future)

### Unit Tests
- `propertyUtils.ts` functions
- Parsing logic validation
- Filter accuracy tests

### Integration Tests
- API endpoint responses
- MongoDB CRUD operations
- Session management

### E2E Tests (Playwright/Cypress)
- Complete user journey
- Property search flow
- Save/unsave functionality

## Monitoring & Analytics (Future)

- **Error Tracking**: Sentry
- **Analytics**: Vercel Analytics / Plausible
- **Performance**: Web Vitals monitoring
- **Database**: MongoDB Atlas monitoring dashboard

## Scalability Considerations

### Current Limits
- ~10 properties in JSON (demo data)
- Single server instance (Vercel serverless)
- No caching layer beyond memory

### Scaling Strategy

**Phase 1 (100 users/day)**:
- Current architecture sufficient
- Add Redis for session caching

**Phase 2 (1,000 users/day)**:
- Move property data to MongoDB
- Implement pagination
- Add search indexes

**Phase 3 (10,000+ users/day)**:
- Elasticsearch for property search
- CDN for property images
- Database read replicas
- Load balancing

## Known Limitations

1. **No User Authentication**: Sessions are anonymous
2. **No Pagination**: All results returned at once (limited to 12)
3. **Simple NLP**: Regex-based parsing (not ML-powered)
4. **No Real-time Updates**: Static property data
5. **No Property Details Page**: Cards link nowhere currently

## Future Roadmap

### Q1 2026
- [ ] User authentication (NextAuth.js)
- [ ] Property detail pages
- [ ] Advanced filtering UI
- [ ] Map view integration (Google Maps API)

### Q2 2026
- [ ] OpenAI GPT integration for smarter parsing
- [ ] Email notifications for saved properties
- [ ] Property comparison tool
- [ ] Mortgage calculator

### Q3 2026
- [ ] Agent/broker dashboard
- [ ] Property listing management (CRUD)
- [ ] Virtual tours (Matterport integration)
- [ ] Chat history persistence

## Conclusion

Agent Mira demonstrates a production-ready MVP architecture with:
- ✅ Clean separation of concerns
- ✅ Type-safe codebase (TypeScript)
- ✅ Scalable data layer
- ✅ Modern UI/UX patterns
- ✅ Vercel-optimized deployment

**Ready for hackathon judging and real-world testing.**
