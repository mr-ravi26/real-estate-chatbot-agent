# 🚀 Quick Start Guide

Get Agent Mira running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Setup Environment

```bash
cp .env.example .env
```

Edit `.env` and add your MongoDB URI:

```env
MONGODB_URI=mongodb://localhost:27017/real-estate-chatbot
# OR use MongoDB Atlas connection string
```

## Step 3: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## Step 4: Test the Chatbot

Try these queries:

- `2 BHK under $500K in Miami`
- `Luxury properties with pool`
- `3 bedroom house in California`
- `Studio apartment under $300K`

## Project Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run lint` | Run ESLint |

## File Structure (Key Files)

```
├── app/
│   ├── page.tsx              # Homepage
│   ├── layout.tsx            # Root layout
│   └── api/
│       ├── chat/route.ts     # Chat API
│       └── save-property/route.ts  # Save API
├── components/
│   ├── ChatInterface.tsx     # Main chat UI
│   └── PropertyCard.tsx      # Property cards
├── lib/
│   ├── propertyUtils.ts      # Core logic
│   └── mongodb.ts            # Database
└── data/
    ├── property_basics.json
    ├── property_characteristics.json
    └── property_images.json
```

## MongoDB Setup (Optional for Local Dev)

**Option 1: Use MongoDB Atlas (Recommended)**
- Free tier available
- See [DEPLOYMENT.md](DEPLOYMENT.md) for setup

**Option 2: Local MongoDB**
```bash
# Install MongoDB locally
brew install mongodb-community  # macOS
# OR
sudo apt install mongodb        # Linux

# Start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongodb           # Linux

# Set .env
MONGODB_URI=mongodb://localhost:27017/real-estate-chatbot
```

## Adding New Properties

Edit files in `/data` folder:

1. Add to `property_basics.json`
2. Add same ID to `property_characteristics.json`
3. Add same ID to `property_images.json`
4. Restart server

## Troubleshooting

### Port 3000 Already in Use

```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# OR use different port
PORT=3001 npm run dev
```

### MongoDB Connection Error

```bash
# Check if MongoDB is running
mongosh  # Should connect successfully

# If using Atlas, verify:
# 1. Correct connection string
# 2. IP whitelisted (0.0.0.0/0 for all)
# 3. Database user exists
```

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

## What's Next?

- Read [README.md](README.md) for full documentation
- See [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- Check [DEPLOYMENT.md](DEPLOYMENT.md) to deploy to Vercel

## Need Help?

- Check existing issues on GitHub
- Read the full README
- Review error logs in terminal

---

**Happy coding! 🎉**
