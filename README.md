# Agent Mira - AI Real Estate Chatbot 🏡
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

A production-ready, next-generation real estate chatbot with intelligent property matching, built for the Agent Mira Hackathon. Features a premium Next-Zen UI inspired by Apple, Linear, and Vercel.

## ✨ Features

- 🤖 **Intelligent Chat Interface** - Natural language property search with AI-powered understanding
- 🔍 **Smart Property Matching** - Filters by budget, location, bedrooms, amenities
- 💾 **Persistent Favorites** - Save properties to MongoDB Atlas with session tracking
- 🎨 **Next-Zen UI** - Dark-first premium design with smooth animations
- 📱 **Fully Responsive** - Mobile-first design that works on all devices
- 🚀 **Production Ready** - Optimized for Vercel deployment
- ⚡ **Real-time Search** - Instant property filtering and ranking
- 🏗️ **Scalable Architecture** - Clean, modular code structure

## 🎯 Live Demo

**Coming Soon**: Deploy to Vercel and add your live URL here

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion** (animations)
- **Lucide React** (icons)

### Backend
- **Next.js API Routes**
- **MongoDB Atlas**
- **Node.js**

### Deployment
- **Vercel** (hosting)
- **MongoDB Atlas** (database)

## 📁 Project Structure

```
real-estate-chatbot-agent/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts          # Chat endpoint with NLP parsing
│   │   └── save-property/
│   │       └── route.ts          # Save/retrieve favorite properties
│   ├── globals.css               # Global styles & CSS variables
│   ├── layout.tsx                # Root layout with metadata
│   └── page.tsx                  # Home page
├── components/
│   ├── ui/
│   │   ├── button.tsx            # Reusable button component
│   │   ├── card.tsx              # Card components
│   │   └── input.tsx             # Input component
│   ├── ChatInterface.tsx         # Main chat UI component
│   ├── PropertyCard.tsx          # Property display card
│   └── TypingIndicator.tsx       # Chat typing animation
├── data/
│   ├── property_basics.json      # Property titles, prices, locations
│   ├── property_characteristics.json  # Bedrooms, bathrooms, amenities
│   └── property_images.json      # Property images
├── lib/
│   ├── mongodb.ts                # MongoDB connection client
│   ├── propertyUtils.ts          # Data merging & filtering logic
│   ├── types.ts                  # TypeScript interfaces
│   └── utils.ts                  # Utility functions
├── .env.example                  # Environment variables template
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── vercel.json                   # Vercel deployment config
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account
- Git

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd real-estate-chatbot-agent
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your MongoDB URI:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/real-estate-chatbot?retryWrites=true&w=majority
OPENAI_API_KEY=sk-your-key-here  # Optional
```

4. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## 🌐 Deployment

### Deploy to Vercel

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables:
     - `MONGODB_URI`
     - `OPENAI_API_KEY` (optional)

3. **Deploy**
   - Vercel will automatically build and deploy
   - Your app will be live at `https://your-app.vercel.app`

### MongoDB Atlas Setup

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user
3. Whitelist all IPs (0.0.0.0/0) for Vercel
4. Get your connection string
5. Replace `<username>`, `<password>`, and `<cluster>` in your connection string

## 🎨 Design Philosophy

**Next-Zen Theme**
- Dark-first color palette
- Subtle gradients and blur effects
- Smooth animations and transitions
- Large whitespace for calm UX
- Premium typography
- Glass-morphism cards

## 🧠 How It Works

### 1. Data Merging
Three JSON files are merged by ID on server startup:
- `property_basics.json` → Basic info
- `property_characteristics.json` → Specs & amenities
- `property_images.json` → Images

Cached in memory for fast access.

### 2. Natural Language Parsing
User input like "2 BHK under 80 lakhs in Noida with parking" is parsed to extract:
- **Budget**: 8000000 (80 lakhs = 8M)
- **Bedrooms**: 2
- **Location**: Noida
- **Amenities**: ["parking"]

### 3. Intelligent Filtering
Properties are filtered by:
- Price ≤ budget
- Location (partial match)
- Exact bedroom count
- All required amenities present

### 4. Ranking & Display
Properties are ranked by amenity count and displayed as premium cards.

### 5. Favorites (MongoDB)
Users can save properties, persisted by session ID in MongoDB.

## 📊 API Endpoints

### POST `/api/chat`
**Request:**
```json
{
  "message": "2 BHK under $500K in Miami with parking"
}
```

**Response:**
```json
{
  "message": "I found 3 properties matching your criteria...",
  "properties": [...],
  "preferences": {
    "budget": 500000,
    "bedrooms": 2,
    "location": "Miami",
    "amenities": ["parking"]
  }
}
```

### POST `/api/save-property`
Save a property for the user session.

### GET `/api/save-property?sessionId=xxx`
Retrieve saved properties for a session.

### DELETE `/api/save-property`
Remove a saved property.

## 🏆 Hackathon Highlights

### Why Agent Mira Stands Out

1. **Production Quality** - Not a demo, built like a real startup MVP
2. **Smart NLP Parsing** - Understands natural language without OpenAI (optional)
3. **Premium UX** - Next-Zen design that rivals top SaaS apps
4. **Real Database** - MongoDB Atlas with proper session management
5. **Fully Deployable** - One-click Vercel deployment
6. **Clean Architecture** - Modular, maintainable, scalable code

### Technical Achievements

✅ Merges 3 data sources by ID with efficient caching  
✅ Natural language preference extraction  
✅ Real-time filtering with multiple criteria  
✅ Session-based favorites with MongoDB  
✅ Responsive design with animations  
✅ Type-safe with TypeScript  
✅ SEO-optimized with Next.js metadata  
✅ Production-ready error handling  

## 🎓 Challenges Faced

1. **Data Merging**: Handling missing/mismatched IDs across JSON files
   - **Solution**: Created lookup maps with graceful fallbacks

2. **NLP Parsing**: Extracting structured data from unstructured text
   - **Solution**: Regex patterns for common phrases + keyword matching

3. **State Management**: Managing chat history + saved properties
   - **Solution**: React hooks with efficient re-renders

4. **Performance**: Large property lists causing lag
   - **Solution**: Data caching + result limiting + lazy loading

## 🔮 Future Enhancements

- [ ] OpenAI GPT integration for smarter parsing
- [ ] Real-time property recommendations
- [ ] Property comparison tool
- [ ] Virtual tours (3D/360°)
- [ ] Mortgage calculator
- [ ] Email notifications for saved properties
- [ ] User authentication (NextAuth.js)
- [ ] Admin dashboard for property management
- [ ] Search filters UI panel
- [ ] Property detail modal/page

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

Built with ❤️ for the Agent Mira Hackathon

---

**⭐ If you like this project, please give it a star on GitHub!**

## 🙏 Acknowledgments

- Design inspiration: Apple, Linear, Vercel
- Icons: Lucide React
- Images: Pexels
- Hosting: Vercel
- Database: MongoDB Atlas

---

**Made with Next.js** • **Deployed on Vercel** • **Powered by MongoDB Atlas**
