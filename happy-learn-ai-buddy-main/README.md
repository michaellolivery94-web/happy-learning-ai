# HappyLearn CBC AI Buddy 🎓

An AI-powered learning companion for the Kenyan Competency-Based Curriculum (CBC), designed to help learners from Grades 1-9 explore academic topics through inquiry, discovery, and real-life application.

## Project info

**URL**: https://lovable.dev/projects/63cdd8d4-f992-468f-ada8-1393ba6b5c97

## 🌟 Features

- **CBC-Aligned AI Tutor**: "Happy" provides personalized tutoring aligned with Kenya's CBC curriculum
- **Grade & Subject Selection**: Support for Grades 1-9 across multiple subjects
- **Progress Tracking**: Track questions asked, lessons completed, and learning streaks
- **Competency-Based Learning**: Focus on practical skills and real-world application
- **Kenyan Context**: Uses locally relevant examples (shillings, matatus, local wildlife, etc.)
- **Bilingual Support**: English explanations with Kiswahili encouragement phrases
- **Secure Architecture**: API keys never exposed to client; all AI requests proxied server-side

## 🏗️ Architecture

### Frontend (React + TypeScript + Vite)
- **Chat Interface**: Real-time streaming responses with typing indicators
- **Grade Selector**: Dynamic subject selection based on CBC structure
- **Progress Dashboard**: Visual progress tracking and competency mastery
- **Authentication**: Supabase Auth with email/password

### Backend (Supabase Edge Functions)
- **ai-tutor Edge Function**: Serverless proxy for AI requests
  - Location: `supabase/functions/ai-tutor/index.ts`
  - Handles message validation and rate limiting
  - Constructs CBC-aligned system prompts server-side
  - Streams responses for better UX
  - Temperature: 0.25 (accurate, curriculum-focused responses)
  - Max tokens: 700 (concise, age-appropriate answers)

### Database (Supabase PostgreSQL)
- **progress**: User learning progress and competencies
- **chat_history**: Conversation persistence
- **Row Level Security**: User data isolation

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+) - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- npm or yarn
- Supabase account

### Local Development

1. **Clone the repository**
```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. **Install dependencies**
```sh
npm install
```

3. **Configure environment variables**
```sh
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Get these from: Supabase Dashboard → Your Project → Settings → API

4. **Start development server**
```sh
npm run dev
```

5. **Build for production**
```sh
npm run build
```

## 🧪 Testing Checklist

Run these manual tests after making changes:

### Test 1: Contextual Curriculum Responses
- [ ] Send: "Happy, teach me about energy for Grade 6 Science."
- [ ] Expected: Response explains energy with Kenyan examples + 1-2 check questions
- [ ] Verify: Response is concise (150-300 words), uses Explain → Example → Check pattern

### Test 2: Grade-Appropriate Content
- [ ] Send: "Explain fractions for Grade 4"
- [ ] Expected: Simple explanation suitable for Grade 4, with real-life examples
- [ ] Verify: Uses Kenyan context (e.g., cutting chapati, sharing oranges)

### Test 3: Dynamic Grade/Subject Context
- [ ] Change grade selector to "Grade 8"
- [ ] Change subject to "Mathematics"
- [ ] Ask: "Teach me about quadratic equations"
- [ ] Expected: Response matches Grade 8 level complexity
- [ ] Change back to Grade 4, ask about fractions again
- [ ] Verify: Response adjusts to simpler Grade 4 level

### Test 4: Security - No API Key Leakage
- [ ] Run `npm run build`
- [ ] Inspect built JS files in `dist/assets/`
- [ ] Run: `grep -r "LOVABLE_API_KEY\|OPENAI_API_KEY\|sk-" dist/assets/`
- [ ] Expected: No API keys found in client bundle

### Test 5: Message History & Windowing
- [ ] Send multiple messages (15+)
- [ ] Verify: Happy remembers recent context
- [ ] Check: Browser Network tab shows only last ~12 messages sent to server
- [ ] Verify: Responses remain contextually relevant

### Test 6: UX & Responsiveness
- [ ] Enter key sends message
- [ ] Shift+Enter creates new line
- [ ] Input disabled while waiting for response
- [ ] "Happy is thinking..." loader appears
- [ ] Messages auto-scroll to bottom
- [ ] Works on mobile viewport (test responsive design)

### Test 7: Error Handling
- [ ] Disconnect internet
- [ ] Send message
- [ ] Expected: Clear error message, no crash
- [ ] Reconnect, verify app recovers

### Test 8: Progress Tracking
- [ ] Ask 5 questions
- [ ] Check Dashboard
- [ ] Verify: Questions count incremented
- [ ] Verify: Lessons completed = questionsAsked / 5
- [ ] Verify: Learning streak updates

## 🔐 Security & Privacy

### API Key Management
- ✅ **Server-side only**: AI API keys (LOVABLE_API_KEY) stored in Supabase Edge Function secrets
- ✅ **Never exposed**: Keys never sent to client or visible in browser
- ✅ **Proxy pattern**: All AI requests routed through `ai-tutor` edge function
- ✅ **Validation**: Message structure validated server-side before forwarding

### Rate Limiting & Cost Control
- **Sliding window**: Only last 12 messages sent to AI (reduces token usage)
- **Temperature**: 0.25 (balance accuracy and cost)
- **Max tokens**: 700 (concise responses)
- **Debounced sync**: Progress updates batched to reduce database writes
- **Recommended**: Implement per-user rate limiting (50 requests/min) in production

### Row Level Security (RLS)
- All database tables protected with RLS policies
- Users can only access their own data
- Enforced at database level (defense in depth)

## 📚 Technologies Used

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn-ui, Tailwind CSS, Radix UI
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **AI**: Lovable AI Gateway (Gemini 2.5 Flash)
- **Database**: PostgreSQL (via Supabase)
- **Deployment**: Lovable / Netlify / Vercel compatible

## 📁 Project Structure

```
happy-learn-ai-buddy-main/
├── src/
│   ├── components/
│   │   ├── GradeSelector.tsx       # CBC grade & subject picker
│   │   ├── Navbar.tsx              # Navigation bar
│   │   └── ui/                     # shadcn-ui components
│   ├── contexts/
│   │   ├── AuthContext.tsx         # Authentication state
│   │   └── ProgressContext.tsx     # Progress tracking with debounced sync
│   ├── data/
│   │   └── cbcStructure.ts         # CBC curriculum structure (Grades 1-9)
│   ├── pages/
│   │   ├── Chat.tsx                # Main AI chat interface
│   │   ├── Dashboard.tsx           # Progress & competency dashboard
│   │   ├── Auth.tsx                # Login/signup
│   │   └── Lessons.tsx             # Learning resources
│   └── integrations/
│       └── supabase/
│           └── client.ts           # Supabase client setup
├── supabase/
│   ├── functions/
│   │   └── ai-tutor/
│   │       └── index.ts            # Serverless AI proxy (CRITICAL)
│   └── migrations/                 # Database schema migrations
├── .env.example                    # Environment variable template
└── README.md                       # This file
```

## 🔧 Configuration

### Supabase Edge Function Secrets

The `ai-tutor` edge function requires the `LOVABLE_API_KEY` secret. This is already configured in your Supabase project.

To verify or update:
1. Go to Supabase Dashboard → Your Project
2. Navigate to Edge Functions → Settings
3. Check that `LOVABLE_API_KEY` is set

### CBC Curriculum Data

The CBC structure is defined in `src/data/cbcStructure.ts`. It includes:
- Grades 1-9
- Subject areas per grade (Mathematics, Science, English, Kiswahili, Social Studies, etc.)
- Topics and learning outcomes per subject
- Competency descriptions

To update curriculum data, edit this file and rebuild.

## 🚢 Deployment

### Lovable (Recommended)
1. Visit [Lovable Project](https://lovable.dev/projects/63cdd8d4-f992-468f-ada8-1393ba6b5c97)
2. Click Share → Publish
3. Automatic deployment with edge functions

### Manual Deployment
1. Build: `npm run build`
2. Deploy `dist/` folder to any static host (Netlify, Vercel, etc.)
3. Ensure environment variables are set
4. Edge functions are automatically deployed via Supabase

## 🤝 Contributing

This project follows CBC educational standards. When contributing:
- Maintain pedagogical approach: Explain → Example → Check
- Use Kenyan context in examples
- Keep responses concise and age-appropriate
- Follow existing code structure
- Test against all acceptance criteria above

## 📄 License

See project license file.

## 🌐 Resources

- [Kenyan CBC Curriculum](https://www.kicd.ac.ke/)
- [Supabase Documentation](https://supabase.com/docs)
- [Lovable AI Platform](https://lovable.dev/)
- [SDG 4: Quality Education](https://sdgs.un.org/goals/goal4)

## ✨ Credits

Built with Lovable for Kenyan learners. Aligned with SDG 4: Quality Education.

**Hongera! Keep learning and building!** 🇰🇪
