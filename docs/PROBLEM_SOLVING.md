# Problem-Solving Approach

> Exercise requirement: "We value how you approach the problem more than achieving a perfect end result. If you encounter difficulties, include comments explaining: the specific issue, approaches you tried, and assumptions you made."

This shows how we approached the 4 core PDF requirements and the extra product features.

---

## Core Exercise Requirements

### 1. Traffic Data API ✅

**Built**: Adapter pattern with Google Maps → Mapbox → Mock fallback

**Problem**: API costs ($5+ per 1,000 requests) and rate limits (2,500 free/day)

**Solution**: Hybrid approach
- Cron job caches traffic every 10 min → saves to DB
- Dashboard reads cached data (fast, cheap)
- User workflows fetch live data (accurate)

**Trade-off**: Dashboard up to 10 min stale, notifications always fresh

**Code**: `src/infrastructure/adapters/traffic/GoogleMapsAdapter.ts`

---

### 2. AI Message Generation (gpt-4o-mini) ✅

**Built**: OpenAI API with template fallbacks

**Problem**: AI sometimes generates placeholders like `[Your Company]`, `[insert contact]`

**Solution**: Updated prompts with:
- Explicit company info (name, email, phone, website)
- "NO placeholders" instruction
- Customer name in greeting

**Before**: "Dear Valued Customer, ... [Your Name] [Your Company]"
**After**: "Dear Red Pace Dev, ... Freight Delay Notification System Team, support@freight-notifications.com"

**Code**: `src/infrastructure/adapters/ai/prompts/NotificationPromptBuilder.ts`

---

### 3. Notification API (Email/SMS) ✅

**Built**: SendGrid + Twilio with mock fallbacks

**Challenges**:
- SendGrid needs verified sender
- Twilio trial only works with verified numbers
- API keys might not be configured

**Solution**: Mock adapters for testing, clear setup docs

**Code**: `src/infrastructure/adapters/notifications/`

---

### 4. Temporal Workflow (4 Steps) ✅

**Built**: Modular activities for each step

**Problem**: Workflows must be deterministic, can't use logger

**What didn't work**: Using logger in workflow → breaks replays
**Solution**: `console.log()` in workflows, logger in activities

**Why**: Temporal replays workflows on failure. External deps break determinism.

**Code**: `src/workflows/workflows.ts`

---

## UI & Visual Challenges

### Problem: Real-time Dashboard Without Auto-refresh

**Issue**: Users had to manually refresh to see workflow updates → frustrating UX

**Approaches tried**:
1. Manual refresh → users complained ❌
2. Auto-refresh every 5 sec → infinite loops, server overload ❌
3. **Smart polling** (what we chose):
   - React Query refetches every 10s for active deliveries
   - Stops when delivery completed/cancelled
   - Only polls if tab is visible

**Implementation**:
```typescript
useDeliveries({
  refetchInterval: (data) => {
    const hasActive = data?.some(d => d.status === 'pending');
    return hasActive ? 10000 : false; // Poll or stop
  },
  refetchOnWindowFocus: true
});
```

**Trade-off**: Slight delay seeing updates vs server load

**Code**: `src/core/infrastructure/http/services/deliveries/queries/listDeliveries.ts`

---

### Problem: Traffic Map Performance with 43+ Routes

**Issue**: Rendering 43 polylines + incident markers made map laggy on mobile

**Approaches tried**:
1. Render all routes always → slow on mobile ❌
2. Pagination → users can't see full picture ❌
3. **Smart filtering + clustering**:
   - Filter by traffic condition (light/moderate/heavy/severe)
   - Cluster nearby incidents
   - Lazy load route details on click

**Result**: Smooth performance even with 100+ routes

**Code**: `src/components/features/monitoring/TrafficMap.tsx`

---

### Problem: Accessible UI (WCAG AAAA Compliance)

**Challenges**:
- Color-blind users can't distinguish traffic severity by color alone
- Keyboard navigation needed for all actions
- Screen readers need proper labels

**Solutions**:
1. **Severity icons + colors**: 🟢 Light, 🟡 Moderate, 🔴 Heavy, ⚫ Severe
2. **Keyboard navigation**: Tab through all interactive elements
3. **ARIA labels**: Every button/link has descriptive label
4. **Focus indicators**: Clear outlines for keyboard users

**Example**:
```tsx
<button
  aria-label="View delivery details for tracking ABC123"
  className="focus:ring-2 focus:ring-blue-500"
>
  View Details
</button>
```

**Code**: All components in `src/components/`

---

### Problem: Mobile-First Responsive Design

**Issue**: Dashboard looked good on desktop but broken on mobile

**Approach**: Mobile-first CSS, then scale up
```css
/* Mobile first */
.container { display: flex; flex-direction: column; }

/* Desktop override */
@media (min-width: 768px) {
  .container { flex-direction: row; }
}
```

**Testing**: Verified on iPhone SE (smallest modern screen) → iPhone Pro Max

**Code**: `src/app/globals.css`, all component styles

---

## Architecture Decisions

### Decision: Clean Architecture vs Simple Script

**Considered**: Single `index.ts` with everything
- Faster to write ✓
- Hard to test ✗
- Can't swap providers ✗

**Chose**: Clean Architecture
- More setup ✗
- Easy to test ✓
- Swappable adapters ✓

**Why**: Shows systematic thinking, production-ready

---

### Decision: Result Pattern Instead of Exceptions

**Instead of**:
```typescript
try {
  return await api.getData();
} catch (error) {
  throw error; // Crashes
}
```

**We use**:
```typescript
const result = await api.getData();
if (!result.success) {
  logger.error(result.error.message);
  return fallback; // Graceful
}
return result.value;
```

**Why**: Never crashes, type-safe, explicit errors

---

### Decision: Database for Traffic Caching

**Why**:
- API costs (avoid constant fetches)
- Speed (dashboard instant load)
- Analytics (track patterns)

**What we cache**:
- Traffic snapshots (10 min refresh)
- Notification history
- Workflow executions

**Trade-off**: Some staleness vs cost/speed

---

## Key Assumptions

**General**:
- Users know deliveries by route + partial tracking
- English-only OK for MVP
- 10-min traffic staleness acceptable for monitoring
- Live data mandatory for notifications

**Technical**:
- Temporal server running
- Environment vars configured
- Modern browsers (Chrome/Firefox/Safari)
- Supabase free tier sufficient

**UI**:
- Users prefer auto-refresh over manual
- Mobile users are 30%+ of traffic
- Accessibility matters (screen readers, keyboard nav)

---

## What Didn't Work

1. **Always fetch live traffic** → hit rate limits, too slow
2. **Workflow patching** → messy code, hard to maintain
3. **Auto-refresh every 5 sec** → server overload, infinite loops
4. **Render all map routes** → laggy on mobile
5. **Color-only severity** → failed accessibility

---

## Documentation Philosophy

Every decision has:
- Problem we faced
- Approaches tried (what failed)
- Trade-offs accepted
- Assumptions made

Shows we valued **how we think** over just shipping code.

For detailed technical issues (Temporal versioning, DB migrations, SMS optimization), see [README Issues section](../README.md#-issues-encountered--solutions).

**Questions?** Email [red.pace.dev@gmail.com](mailto:red.pace.dev@gmail.com)
