# HappyLearn CBC Chat - Testing Guide

## Quick Start Testing

### 1. Setup & Installation
```bash
cd happy-learn-ai-buddy-main
npm install
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2. Start Development Server
```bash
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Manual Test Scenarios

### Test 1: Contextual Curriculum Responses ✅

**Objective**: Verify Happy provides curriculum-aligned responses with Kenyan examples

**Steps**:
1. Navigate to Chat page
2. Ensure Grade is set to "Grade 6" and Subject is "Science"
3. Send message: `"Happy, teach me about energy for Grade 6 Science."`

**Expected Result**:
- Response explains energy concept clearly
- Uses Kenyan examples (e.g., solar panels, matatu engines, firewood)
- Follows Explain → Example → Check pattern
- Includes 1-2 short check questions at end
- Response length: 150-300 words
- Ends with motivational phrase (e.g., "Hongera! Keep going!")

**Pass Criteria**:
- [ ] Response is relevant to Grade 6 Science level
- [ ] Includes Kenyan real-world examples
- [ ] Contains check questions
- [ ] Has motivational ending
- [ ] Total response time < 10 seconds

---

### Test 2: Grade-Appropriate Content ✅

**Objective**: Verify responses adjust to grade level complexity

**Steps**:
1. Change Grade to "Grade 4"
2. Change Subject to "Mathematics"
3. Send message: `"Explain fractions for Grade 4"`

**Expected Result**:
- Simple explanation suitable for 10-year-olds
- Uses concrete examples (cutting chapati, sharing oranges, dividing matoke)
- Avoids complex terminology
- Visual/practical examples emphasized
- Ends with encouragement

**Pass Criteria**:
- [ ] Language is age-appropriate (Grade 4 level)
- [ ] Uses Kenyan food/objects in examples
- [ ] Explanation is concrete, not abstract
- [ ] No advanced mathematical terms
- [ ] Response builds confidence

---

### Test 3: Dynamic Grade/Subject Context Switching ✅

**Objective**: Verify system adjusts responses when grade/subject changes

**Steps**:
1. Set Grade to "Grade 8", Subject to "Mathematics"
2. Send: `"Teach me about quadratic equations"`
3. Observe response complexity
4. Change Grade to "Grade 4", Subject to "Mathematics"
5. Send: `"Explain fractions"`
6. Compare response complexity

**Expected Result**:
- Grade 8 response uses algebraic notation, formal language
- Grade 4 response uses simple visuals and everyday examples
- Clear difference in complexity and vocabulary
- Both responses appropriate for their grade level

**Pass Criteria**:
- [ ] Grade 8 response includes equation format (ax² + bx + c = 0)
- [ ] Grade 4 response avoids complex notation
- [ ] Kenyan examples appropriate to age in both cases
- [ ] Tone adjusts (more mature for Grade 8, playful for Grade 4)

---

### Test 4: Security - No API Key Leakage ✅

**Objective**: Verify API keys never exposed in client bundle

**Steps**:
```bash
npm run build
cd dist/assets
grep -r "LOVABLE_API_KEY\|OPENAI_API_KEY\|sk-proj\|sk-" .
grep -r "Bearer\|Authorization" . | grep -v "Bearer \${"
```

**Expected Result**:
- Zero matches for API keys
- Zero hardcoded Authorization headers
- Build completes successfully

**Pass Criteria**:
- [ ] No API keys in dist/assets/*.js
- [ ] No hardcoded bearer tokens
- [ ] Build process completes without errors
- [ ] All environment variables use import.meta.env pattern

**Security Check Script**:
```bash
#!/bin/bash
echo "Building project..."
npm run build

echo "Checking for API key leakage..."
LEAKS=$(grep -r "LOVABLE_API_KEY\|OPENAI_API_KEY\|sk-" dist/assets/ 2>/dev/null)

if [ -z "$LEAKS" ]; then
    echo "✅ PASS: No API keys found in client bundle"
    exit 0
else
    echo "❌ FAIL: API keys detected in bundle:"
    echo "$LEAKS"
    exit 1
fi
```

---

### Test 5: Message History & Windowing ✅

**Objective**: Verify only recent messages sent to reduce tokens

**Steps**:
1. Open browser DevTools → Network tab
2. Clear network log
3. Send 15 messages in conversation (about various topics)
4. On the 15th message, inspect the request payload

**Expected Result**:
- Request body contains `messages` array
- Array length is ≤ 12 messages (sliding window)
- Response still contextually relevant
- Happy remembers recent context (not oldest messages)

**Pass Criteria**:
- [ ] Network request shows messages array with ~12 items
- [ ] Full conversation history not sent (privacy + cost)
- [ ] Responses remain contextual and coherent
- [ ] No "I don't remember" confusion

**Manual Check**:
```javascript
// In browser console during chat:
// After sending 15+ messages, intercept the request:
// Check the payload size in Network tab
```

---

### Test 6: UX & Responsiveness ✅

**Objective**: Verify user interface is intuitive and responsive

**Test Matrix**:

| Action | Expected Behavior | Status |
|--------|------------------|--------|
| Press Enter | Sends message | [ ] |
| Press Shift+Enter | Adds new line in input | [ ] |
| Click Send while loading | Button disabled | [ ] |
| Send message | "Happy is thinking..." appears | [ ] |
| Receive reply | Auto-scrolls to bottom | [ ] |
| Resize to mobile (375px) | Layout responsive, no overflow | [ ] |
| Tab navigation | Can navigate with keyboard | [ ] |
| Long message input | Textarea expands (max 120px) | [ ] |
| Empty input + click Send | Button disabled | [ ] |

**Mobile Testing**:
1. Open DevTools → Toggle device toolbar
2. Test on iPhone SE (375×667)
3. Test on iPad (768×1024)

**Pass Criteria**:
- [ ] All interactions work as expected
- [ ] No horizontal scrolling on mobile
- [ ] Text readable without zoom
- [ ] Touch targets ≥ 44×44px

---

### Test 7: Error Handling ✅

**Objective**: Verify graceful degradation when network fails

**Steps**:
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Send a message
4. Observe error handling
5. Re-enable network
6. Send another message

**Expected Result**:
- Clear error toast appears
- Error message: "Failed to get response from Happy..."
- Empty assistant message placeholder removed
- Chat state remains consistent
- After re-enabling network, next message works

**Pass Criteria**:
- [ ] Error toast displays with clear message
- [ ] No crash or blank screen
- [ ] User can retry sending
- [ ] Previous messages intact
- [ ] App recovers automatically when online

---

### Test 8: Progress Tracking ✅

**Objective**: Verify progress metrics update correctly

**Steps**:
1. Note current question count on Dashboard
2. Go to Chat page
3. Send exactly 5 questions (about different topics)
4. Return to Dashboard
5. Check updated metrics

**Expected Result**:
- Questions Asked: +5
- Lessons Completed: +1 (every 5 questions = 1 lesson)
- Learning Streak: Updates if today is a new day
- Recent Learning Topics: Shows subjects from chat

**Pass Criteria**:
- [ ] Question count increases by 5
- [ ] Lesson count increases by 1
- [ ] Dashboard reflects changes (may take 2s due to debounce)
- [ ] Streak logic works correctly
- [ ] No duplicate writes to database

**Database Verification**:
Check Supabase Table Editor:
1. Open Supabase Dashboard → Table Editor
2. Select `progress` table
3. Verify your user's row updated
4. Check `questions`, `lessons`, `streak` columns

---

## Automated Testing Script

Save as `test.sh`:

```bash
#!/bin/bash

echo "🧪 HappyLearn CBC Chat - Automated Tests"
echo "========================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

# Test 1: Dependencies installed
echo -n "Test 1: Dependencies installed... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}FAIL${NC} - Run 'npm install'"
    ((FAIL++))
fi

# Test 2: Environment file exists
echo -n "Test 2: Environment file exists... "
if [ -f ".env" ]; then
    echo -e "${GREEN}PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}FAIL${NC} - Copy .env.example to .env"
    ((FAIL++))
fi

# Test 3: Required files exist
echo -n "Test 3: Core files exist... "
REQUIRED_FILES=(
    "src/pages/Chat.tsx"
    "supabase/functions/ai-tutor/index.ts"
    "src/contexts/ProgressContext.tsx"
    "src/components/GradeSelector.tsx"
    "src/data/cbcStructure.ts"
)

ALL_EXIST=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}FAIL${NC} - Missing: $file"
        ALL_EXIST=false
        ((FAIL++))
        break
    fi
done

if [ "$ALL_EXIST" = true ]; then
    echo -e "${GREEN}PASS${NC}"
    ((PASS++))
fi

# Test 4: Build process
echo -n "Test 4: Build process... "
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}FAIL${NC} - Build errors detected"
    ((FAIL++))
fi

# Test 5: No API key leakage
echo -n "Test 5: API key security... "
if [ -d "dist" ]; then
    LEAKS=$(grep -r "LOVABLE_API_KEY\|sk-" dist/assets/ 2>/dev/null | wc -l)
    if [ "$LEAKS" -eq 0 ]; then
        echo -e "${GREEN}PASS${NC}"
        ((PASS++))
    else
        echo -e "${RED}FAIL${NC} - API keys found in bundle!"
        ((FAIL++))
    fi
else
    echo -e "${RED}SKIP${NC} - No dist folder"
fi

# Summary
echo ""
echo "========================================"
echo "Results: ${GREEN}${PASS} passed${NC}, ${RED}${FAIL} failed${NC}"
echo "========================================"

if [ $FAIL -eq 0 ]; then
    echo "✅ All automated tests passed!"
    exit 0
else
    echo "❌ Some tests failed. Please review above."
    exit 1
fi
```

Make it executable:
```bash
chmod +x test.sh
./test.sh
```

---

## Performance Testing

### Load Time Test
```bash
# Build project
npm run build

# Serve production build
npm run preview

# Open in browser and check DevTools → Network tab
# Target metrics:
# - Initial load: < 3 seconds
# - First Contentful Paint: < 1.5 seconds
# - Time to Interactive: < 4 seconds
```

### Message Latency Test
- Send message
- Measure time to first token (should be < 2 seconds)
- Measure time to complete response (should be < 8 seconds)
- Verify streaming works (tokens appear incrementally)

---

## Browser Compatibility Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (macOS/iOS)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Enter key sends message from textarea
- [ ] Focus indicators visible
- [ ] No keyboard traps

### Screen Reader
- [ ] Install NVDA (Windows) or VoiceOver (macOS)
- [ ] Navigate chat interface
- [ ] Verify labels are announced
- [ ] Check button purposes are clear

### Color Contrast
Use DevTools → Lighthouse → Accessibility:
- [ ] All text passes WCAG AA (4.5:1 for normal text)
- [ ] Interactive elements have sufficient contrast
- [ ] Focus indicators visible

---

## Regression Testing Checklist

Before each deployment:

- [ ] All 8 manual tests pass
- [ ] Automated test script passes
- [ ] Build completes without errors
- [ ] No console errors in browser
- [ ] API key security verified
- [ ] Mobile responsiveness confirmed
- [ ] Performance benchmarks met
- [ ] Database migrations applied
- [ ] Edge functions deployed
- [ ] Environment variables set

---

## Troubleshooting Common Issues

### Issue: "Failed to get response from Happy"
**Cause**: Edge function not accessible or LOVABLE_API_KEY missing

**Solutions**:
1. Check Supabase Dashboard → Edge Functions → ai-tutor status
2. Verify LOVABLE_API_KEY is set in Edge Function secrets
3. Check browser console for CORS errors
4. Verify VITE_SUPABASE_URL is correct in .env

### Issue: Progress not saving
**Cause**: Database permissions or debounce timing

**Solutions**:
1. Check Supabase Table Editor → progress table exists
2. Verify RLS policies allow authenticated users to upsert
3. Wait 2-3 seconds after action for debounce
4. Check browser console for errors

### Issue: Grade selector not updating context
**Cause**: Progress context not propagated

**Solutions**:
1. Verify ProgressProvider wraps app in App.tsx
2. Check useProgress hook is called in Chat.tsx
3. Inspect Network tab → verify grade/subject sent to edge function

### Issue: Build fails
**Cause**: Type errors or missing dependencies

**Solutions**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run build 2>&1 | grep "error TS"
```

---

## Test Results Template

Copy and fill out after testing:

```
# HappyLearn Test Results - [Date]

Tester: [Your Name]
Environment: [Development/Staging/Production]
Browser: [Chrome/Firefox/Safari/etc.]

## Manual Tests
- [ ] Test 1: Contextual Curriculum Responses
- [ ] Test 2: Grade-Appropriate Content
- [ ] Test 3: Dynamic Grade/Subject Switching
- [ ] Test 4: Security - API Key Check
- [ ] Test 5: Message Windowing
- [ ] Test 6: UX & Responsiveness
- [ ] Test 7: Error Handling
- [ ] Test 8: Progress Tracking

## Automated Tests
- [ ] Dependencies installed
- [ ] Environment configured
- [ ] Core files present
- [ ] Build successful
- [ ] API keys secure

## Issues Found
[List any bugs or unexpected behavior]

## Overall Status
[ ] All tests passed - Ready to deploy
[ ] Some tests failed - Review required
[ ] Blocking issues - Do not deploy

## Notes
[Any additional observations]
```

---

**Happy Testing! Hongera!** 🧪✅
