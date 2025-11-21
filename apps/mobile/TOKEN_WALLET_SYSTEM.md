# Token Wallet System - Implementation Plan

**Status:** Planning Phase
**Date:** November 10, 2025

## Overview

We're replacing the current multi-quota system with a unified token wallet system. This simplifies the database, improves UX, and makes the app more flexible for future features.

---

## Why This Change?

### Current System Problems
- **Complex Database:** Multiple quota fields (performanceCalcQuota, imageGenQuota, buildPlannerQuota, etc.)
- **Confusing UX:** "You're out of image quota but still have performance calculations left"
- **Hard to Scale:** Every new feature requires a new quota field
- **More Database Queries:** Have to check multiple fields per action

### Token Wallet Benefits
- ✅ **Simple Database:** One `tokens` field instead of many quotas
- ✅ **Better UX:** "You have 50 tokens" - clear and simple
- ✅ **Flexible:** New features just need a token cost assigned
- ✅ **Faster Queries:** Check one field instead of multiple
- ✅ **Better Monetization:** Users understand "buy tokens" easier than "upgrade quota"
- ✅ **Gamification Ready:** Can reward tokens for engagement (future XP system)

---

## Database Changes

### BEFORE (Current Schema)
```prisma
model User {
  id                    String   @id @default(cuid())
  email                 String   @unique
  name                  String?

  // Current quota system - MULTIPLE FIELDS
  performanceCalcQuota  Int      @default(5)
  imageGenQuota         Int      @default(3)
  buildPlannerQuota     Int      @default(10)
  // More quotas as we add features...

  subscriptionTier      String   @default("free")
  stripeCustomerId      String?
  stripeSubscriptionId  String?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### AFTER (New Schema)
```prisma
model User {
  id                    String   @id @default(cuid())
  email                 String   @unique
  name                  String?

  // New token wallet system - ONE FIELD
  tokens                Int      @default(20)

  subscriptionTier      String   @default("free")
  stripeCustomerId      String?
  stripeSubscriptionId  String?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

---

## Token Costs Per Action

Each tool/action costs tokens:

| Action | Token Cost | Reasoning |
|--------|------------|-----------|
| **Performance Calculator** | 2 tokens | Quick calculation, low cost |
| **Build Planner** | 3 tokens | More complex planning |
| **AI Image Generation** | 5 tokens | Most expensive (uses OpenAI API) |
| **Upload to Community** | FREE | Encourages engagement |
| **Like/Comment** | FREE | Encourages community interaction |

**Note:** These costs can be adjusted based on actual usage patterns and API costs.

---

## Subscription Tiers

### Free Tier
- **Starting Tokens:** 20 tokens/month
- **Monthly Refill:** 20 tokens (resets on signup anniversary)
- **Token Carry-Over:** None (resets to 20)
- **Example Usage:**
  - 4 images (20 tokens) OR
  - 10 performance calcs (20 tokens) OR
  - 2 images + 5 perf calcs + 3 build plans (10 + 10 + 9 = 29 tokens)

### Pro Tier ($4.99/month)
- **Starting Tokens:** 200 tokens/month
- **Monthly Refill:** 200 tokens
- **Token Carry-Over:** Up to 100 tokens
- **Example Usage:**
  - 40 images (200 tokens) OR
  - 100 performance calcs OR
  - Mix and match as needed

### Premium Tier ($9.99/month)
- **Starting Tokens:** 500 tokens/month
- **Monthly Refill:** 500 tokens
- **Token Carry-Over:** Unlimited
- **Example Usage:**
  - 100 images (500 tokens) OR
  - Heavy power user flexibility

---

## Migration Plan for Existing Users

When deploying this change, we need to convert existing users' quotas to tokens:

```javascript
// Migration function
async function migrateUsersToTokens() {
  const users = await prisma.user.findMany();

  for (const user of users) {
    // Convert existing quotas to token equivalent
    const tokensFromQuotas =
      (user.performanceCalcQuota * 2) +  // Perf calcs worth 2 tokens each
      (user.imageGenQuota * 5) +          // Images worth 5 tokens each
      (user.buildPlannerQuota * 3);       // Build plans worth 3 tokens each

    await prisma.user.update({
      where: { id: user.id },
      data: {
        tokens: tokensFromQuotas,
        // Remove old quota fields in migration
      }
    });
  }
}
```

---

## Implementation Checklist

### Phase 1: Database Migration
- [ ] Create Prisma migration to add `tokens` field
- [ ] Write migration script to convert existing quotas to tokens
- [ ] Run migration script
- [ ] Remove old quota fields from schema
- [ ] Deploy database changes

### Phase 2: Backend API Updates
- [ ] Update `/api/performance` endpoint
  - Remove quota check logic
  - Add token deduction logic (2 tokens)
- [ ] Update `/api/generate-image` endpoint
  - Remove quota check logic
  - Add token deduction logic (5 tokens)
- [ ] Update `/api/build-planner` endpoint (if exists)
  - Remove quota check logic
  - Add token deduction logic (3 tokens)
- [ ] Update subscription webhook handlers
  - Change quota refill to token refill
  - Update token amounts based on tier

### Phase 3: Frontend UI Updates
- [ ] Update profile page
  - Replace quota displays with token balance
  - Show "Tokens: 45" instead of multiple quotas
- [ ] Update tool usage screens
  - Show token cost before action ("Costs 5 tokens")
  - Show remaining balance after action
- [ ] Update subscription page
  - Change messaging from quotas to tokens
  - "Get 200 tokens/month" instead of "10 images/month"
- [ ] Add token purchase flow (if doing one-time token purchases)

### Phase 4: Testing
- [ ] Test free tier token usage and limits
- [ ] Test Pro tier token usage and carry-over
- [ ] Test Premium tier unlimited carry-over
- [ ] Test subscription upgrades (quota → token conversion)
- [ ] Test subscription downgrades
- [ ] Test monthly refill logic
- [ ] Test edge cases (user runs out of tokens mid-action)

### Phase 5: Deployment
- [ ] Deploy backend changes
- [ ] Run migration script on production database
- [ ] Deploy frontend changes
- [ ] Monitor for errors
- [ ] Update documentation/help pages

---

## Code Examples

### Checking Token Balance (Before Action)
```javascript
// lib/tokens.js
export async function hasEnoughTokens(userId, tokenCost) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tokens: true }
  });

  return user.tokens >= tokenCost;
}
```

### Deducting Tokens (After Action)
```javascript
// lib/tokens.js
export async function deductTokens(userId, tokenCost) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      tokens: {
        decrement: tokenCost
      }
    }
  });

  return user.tokens; // Return new balance
}
```

### Example API Endpoint Update
```javascript
// api/performance.ts
export default async function handler(req, res) {
  const TOKEN_COST = 2;
  const userId = req.user.id; // From auth

  // Check if user has enough tokens
  const hasTokens = await hasEnoughTokens(userId, TOKEN_COST);
  if (!hasTokens) {
    return res.status(403).json({
      error: 'Insufficient tokens',
      tokensNeeded: TOKEN_COST
    });
  }

  // Perform calculation
  const result = await calculatePerformance(req.body);

  // Deduct tokens
  const newBalance = await deductTokens(userId, TOKEN_COST);

  return res.json({
    result,
    tokensRemaining: newBalance
  });
}
```

### Monthly Token Refill
```javascript
// lib/subscriptionRefill.js
export async function refillMonthlyTokens(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  let refillAmount;
  let maxCarryOver;

  switch (user.subscriptionTier) {
    case 'free':
      refillAmount = 20;
      maxCarryOver = 0; // No carry-over
      break;
    case 'pro':
      refillAmount = 200;
      maxCarryOver = 100;
      break;
    case 'premium':
      refillAmount = 500;
      maxCarryOver = Infinity; // Unlimited
      break;
  }

  // Calculate new token balance
  let newTokens;
  if (maxCarryOver === 0) {
    // Free tier: reset to refill amount
    newTokens = refillAmount;
  } else if (maxCarryOver === Infinity) {
    // Premium: add to existing balance
    newTokens = user.tokens + refillAmount;
  } else {
    // Pro: add but cap at refill + maxCarryOver
    newTokens = Math.min(
      user.tokens + refillAmount,
      refillAmount + maxCarryOver
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { tokens: newTokens }
  });
}
```

---

## Future Enhancements (Not Part of Initial Implementation)

### XP/Gamification System
- Earn XP for using tools
- Level up rewards include bonus tokens
- See separate discussion notes

### One-Time Token Purchases
- Allow users to buy token packs
- Example: $2.99 for 50 tokens

### Token Gift System
- Users can gift tokens to friends
- Referral bonuses in tokens

### Token History/Analytics
- Show users where their tokens went
- "You spent 45 tokens this month: 20 on images, 15 on calcs, 10 on planners"

---

## Rollback Plan

If something goes wrong:

1. Keep old quota fields in database (don't drop them immediately)
2. After 30 days of successful token system, remove old fields
3. If rollback needed: Use old quota values still in database

---

## Questions to Resolve

- [ ] Should we allow one-time token purchases? (Can decide later)
- [ ] What happens if user runs out mid-generation? (Show error before starting)
- [ ] Should we show token cost on every button? (Yes, for transparency)
- [ ] Do we want to track token usage analytics? (Yes, add later)

---

## Success Metrics

After implementation, track:
- Average tokens used per user per month
- Free tier conversion rate to paid (did tokens help?)
- User confusion (support tickets about tokens vs quotas)
- Token costs accuracy (are we charging right amounts for API costs?)

---

## Notes

- This system is more flexible and future-proof
- Easier to add new AI features (just assign token cost)
- Better aligns with how users think about credits/points
- Makes gamification natural (earn tokens back via XP system)
