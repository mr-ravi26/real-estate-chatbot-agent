# AI Provider Setup Guide

Your chatbot now supports **multiple AI providers**! Choose the one that works best for you.

## 🎯 Recommended: Google Gemini (FREE)

### ✅ Why Gemini?
- **100% FREE** - Generous free tier
- **60 requests/minute** on free plan
- **Fast and reliable**
- **No credit card required**
- Excellent at NLP tasks

### 🚀 Setup Steps:

1. **Get Your Free API Key:**
   - Visit: https://aistudio.google.com/app/apikey
   - Click "Create API Key"
   - Copy the key

2. **Add to .env file:**
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

3. **That's it!** Your chatbot will automatically use Gemini for:
   - Natural language understanding
   - Intelligent preference extraction
   - Conversational responses

### 📊 Free Tier Limits:
- **15 requests per minute** (RPM)
- **1 million requests per day** (more than enough!)
- **1 million tokens per minute**

---

## 🔄 Alternative Options

### Option 1: OpenAI (Paid)
- Best quality but requires payment
- Already implemented (see `lib/openai.ts`)
- Setup:
  ```env
  OPENAI_API_KEY=sk-proj-...
  ```

### Option 2: Groq (FREE & Super Fast)
- **FREE** with high rate limits
- Uses Llama 3 models
- Very fast inference

**To use Groq:**
1. Get free API key: https://console.groq.com/
2. Install: `npm install groq-sdk`
3. Similar integration to Gemini

### Option 3: Ollama (FREE & Local)
- **Completely FREE** - runs on your machine
- No API calls, full privacy
- No rate limits

**To use Ollama:**
1. Install: https://ollama.com/download
2. Run: `ollama run llama3`
3. Use local endpoint

---

## 🛡️ Fallback System

The chatbot has a **3-tier fallback system**:

1. **Primary**: Try configured AI (Gemini/OpenAI/etc.)
2. **Secondary**: If API fails, use regex-based parsing
3. **Tertiary**: Template-based responses

This means your chatbot **always works**, even if:
- ❌ API key is missing
- ❌ API quota exceeded
- ❌ Network issues
- ❌ Service downtime

---

## 📝 Current Setup

Your chatbot is configured to use:
- **Primary**: Google Gemini (`lib/nlp.ts`)
- **Fallback**: Regex parsing (built-in)

### To Switch Back to OpenAI:
Change this line in `app/api/chat/route.ts`:
```typescript
// From:
import { extractPropertyPreferences, generateNaturalResponse } from '@/lib/nlp';

// To:
import { extractPropertyPreferences, generateNaturalResponse } from '@/lib/openai';
```

---

## 🎨 Feature Comparison

| Feature | Gemini (Free) | OpenAI | Regex Fallback |
|---------|---------------|--------|----------------|
| Cost | FREE ✅ | Paid 💰 | FREE ✅ |
| Quality | Excellent ⭐⭐⭐⭐ | Best ⭐⭐⭐⭐⭐ | Good ⭐⭐⭐ |
| Speed | Fast ⚡⚡⚡ | Medium ⚡⚡ | Instant ⚡⚡⚡⚡ |
| NLP | Advanced 🧠 | Advanced 🧠 | Basic 📝 |
| Limits | 60 req/min | Quota based | Unlimited ♾️ |
| Setup | Easy 😊 | Easy 😊 | No setup 🎉 |

---

## 🧪 Testing

Test your setup:

1. **Without API key** (Regex mode):
   - Remove `GEMINI_API_KEY` from .env
   - Chatbot uses regex parsing
   - Still works perfectly!

2. **With Gemini**:
   - Add `GEMINI_API_KEY` to .env
   - Restart dev server
   - Try: "Show me 2 bedroom apartments under 500K in New York"

---

## 💡 Recommended Configuration

For **production deployment**:

```env
# .env
MONGODB_URI=your_mongodb_uri
GEMINI_API_KEY=your_gemini_key    # Primary AI
```

This gives you:
- ✅ FREE AI-powered NLP
- ✅ Generous rate limits
- ✅ Automatic fallback
- ✅ No costs

---

## 🆘 Troubleshooting

### "No Gemini API key found"
- **Solution**: Add `GEMINI_API_KEY` to your .env file
- **Note**: Chatbot still works using regex fallback

### "Rate limit exceeded"
- **Gemini free tier**: 15 RPM limit
- **Solution**: Wait 1 minute or upgrade plan
- **Fallback**: System automatically uses regex parsing

### API not working
- Check your API key is valid
- Verify .env file is in root directory
- Restart dev server after adding keys

---

## 🚀 Quick Start

**Get started in 2 minutes:**

```bash
# 1. Get free Gemini API key
# Visit: https://aistudio.google.com/app/apikey

# 2. Add to .env
echo "GEMINI_API_KEY=your_key_here" >> .env

# 3. Restart server
npm run dev

# 4. Test at http://localhost:3000
```

**Done!** Your chatbot now has AI-powered NLP! 🎉
