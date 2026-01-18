# 🔄 AI Provider Switching Guide

Your chatbot now supports **easy provider switching** via the `.env` file!

## Quick Setup

Simply change the `AI_PROVIDER` value in your [.env](.env) file:

```env
AI_PROVIDER=gemini    # or "openai" or "regex"
```

That's it! No code changes needed.

---

## 🎯 Available Providers

### 1️⃣ Gemini (Recommended - FREE)

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_key_here
```

**Features:**
- ✅ 100% FREE tier
- ✅ 60 requests/minute
- ✅ Fast responses
- ✅ No credit card needed

**Get your key:** https://aistudio.google.com/app/apikey

---

### 2️⃣ OpenAI (Paid)

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-your-key-here
```

**Features:**
- ✅ Excellent quality
- ✅ GPT-4o-mini model
- ⚠️ Requires payment
- ⚠️ Usage-based pricing

**Get your key:** https://platform.openai.com/api-keys

---

### 3️⃣ Regex (Always FREE)

```env
AI_PROVIDER=regex
# No API keys needed!
```

**Features:**
- ✅ 100% FREE
- ✅ No API calls
- ✅ Instant responses
- ✅ Works offline
- ℹ️ Basic pattern matching (no AI)

---

## 🎮 How to Switch

### Method 1: Edit `.env` file

1. Open [.env](.env)
2. Change `AI_PROVIDER=gemini` to your preferred provider
3. Save the file
4. Restart the dev server (`npm run dev`)

### Method 2: Environment variable

```bash
AI_PROVIDER=openai npm run dev
```

---

## 🛡️ Automatic Fallback

The system automatically falls back to regex parsing if:
- ❌ Selected provider has no API key
- ❌ API quota is exceeded
- ❌ Network error occurs
- ❌ API service is down

**Your chatbot always works!** 🎉

---

## 📊 Provider Comparison

| Feature | Gemini | OpenAI | Regex |
|---------|--------|--------|-------|
| **Cost** | FREE | Paid | FREE |
| **Speed** | Fast ⚡⚡⚡ | Medium ⚡⚡ | Instant ⚡⚡⚡⚡ |
| **Quality** | Excellent ⭐⭐⭐⭐ | Best ⭐⭐⭐⭐⭐ | Good ⭐⭐⭐ |
| **Rate Limit** | 60/min | Quota | Unlimited |
| **Setup** | Easy 😊 | Easy 😊 | None 🎉 |
| **API Key** | Required | Required | Not needed |
| **Fallback** | Auto | Auto | N/A |

---

## 🧪 Testing Different Providers

### Test Gemini
```bash
# In .env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key

# Restart and test
npm run dev
```

### Test OpenAI
```bash
# In .env
AI_PROVIDER=openai
OPENAI_API_KEY=your_key

# Restart and test
npm run dev
```

### Test Regex (No AI)
```bash
# In .env
AI_PROVIDER=regex

# Restart and test - works instantly!
npm run dev
```

---

## 💡 Recommended Configurations

### For Development
```env
AI_PROVIDER=gemini  # Free and fast
GEMINI_API_KEY=your_key
```

### For Production
```env
AI_PROVIDER=gemini  # Cost-effective
GEMINI_API_KEY=your_key
```

### For Testing (No API costs)
```env
AI_PROVIDER=regex  # No API needed
```

---

## 🔍 How It Works

The chatbot intelligently routes requests based on your configuration:

```typescript
// Automatic routing in lib/nlp.ts
switch (AI_PROVIDER) {
  case 'openai':
    return extractWithOpenAI(userMessage);
  case 'gemini':
    return extractWithGemini(userMessage);
  case 'regex':
  default:
    return parseUserPreferencesRegexFallback(userMessage);
}
```

Each provider has:
- ✅ Dedicated extraction function
- ✅ Dedicated response generator
- ✅ Built-in error handling
- ✅ Automatic fallback to regex

---

## 🐛 Troubleshooting

### Provider not changing?
**Solution:** Restart the dev server after editing `.env`
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### "No API key found" message
**Solution:** Add the correct API key for your selected provider
```env
# For Gemini
GEMINI_API_KEY=your_key

# For OpenAI
OPENAI_API_KEY=your_key
```

### Want to test without AI?
**Solution:** Use regex provider
```env
AI_PROVIDER=regex
```

---

## 📝 Current Configuration

Check your current setup in [.env](.env):
```env
AI_PROVIDER=gemini          # Current provider
GEMINI_API_KEY=AIza...      # Gemini key (configured ✅)
# OPENAI_API_KEY=sk-...    # OpenAI key (commented out)
```

---

## 🚀 Quick Start Commands

```bash
# Use Gemini (FREE)
echo "AI_PROVIDER=gemini" >> .env
npm run dev

# Use OpenAI (requires key)
echo "AI_PROVIDER=openai" >> .env
npm run dev

# Use Regex (no setup needed)
echo "AI_PROVIDER=regex" >> .env
npm run dev
```

---

## 🎯 Best Practices

1. **Development:** Use `gemini` or `regex` to save costs
2. **Production:** Use `gemini` for best free performance
3. **Testing:** Use `regex` to test without API dependencies
4. **High Quality:** Use `openai` if budget allows

**Pro Tip:** Start with `gemini` - it's free and works great! 🌟
