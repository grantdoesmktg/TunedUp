# Turbo Tycoon - Implementation Summary

## Overview
Turbo Tycoon is a fully-integrated idle/factory mini-game within TunedUp that allows users to run a turbo parts factory, earn HP (Horsepower Points), and convert HP into TunedUp tokens.

## ✅ Implementation Complete

### Backend Infrastructure

#### Database Models (Prisma)
- **TurboTycoonState**: Stores user's HP balance and lifetime stats
- **TurboFactoryProgress**: Tracks each factory's unlock status, level, production progress
- **TurboResearchOwnership**: Records purchased research nodes (paid users only)

All models use `userEmail` as foreign key with cascade delete.

#### API Endpoint
**Single consolidated endpoint**: `/api/turbo-tycoon.ts`

Actions supported:
- `load` - Initialize/load game state with offline progress calculation
- `sync` - Periodic sync for production updates
- `tap` - Apply taps to speed up factory production
- `unlock_factory` - Unlock new factories
- `upgrade_factory` - Upgrade factory levels
- `buy_research` - Purchase research nodes (paid users only)
- `convert_hp_to_tokens` - Convert HP to TunedUp tokens

#### Game Logic (`lib/turboTycoon/`)
- **gameConfig.ts**: All constants (factories, research tree, token conversions, plan perks)
- **gameLogic.ts**: Core calculations (production, tapping, offline progress, anti-cheat)

### Frontend (React Native)

#### Screens
1. **TurboTycoonScreen** - Main factory dashboard
   - Shows current HP balance
   - Displays all 3 factories with production timers
   - Tap to speed up production
   - Unlock/upgrade factories
   - Shows offline progress rewards
   - Auto-syncs every 5 seconds

2. **TurboTycoonResearchScreen** - Research tree (paid users only)
   - Paywall for free users with upgrade CTA
   - Tier-based research nodes (Tier 1-3)
   - Prerequisites checking
   - Visual owned/locked states

3. **TurboTycoonTokenStoreScreen** - HP → Token conversion
   - Shows current HP and token balances
   - 3 conversion tiers (small, medium, large)
   - "Best Value" featured option
   - Token usage reference guide

#### Components
- **HpDisplay**: Animated HP badge with formatting (K, M, B suffixes)
- **FactoryCard**: Production card with:
  - Gradient backgrounds matching factory type
  - Progress bar and countdown timer
  - Tap interaction
  - Lock/unlock states
  - Upgrade button

#### Navigation
- Added to Tools screen as 4th tool card (green gradient, "FREE" badge)
- Routes added to AppNavigator
- Sub-navigation between Factory/Research/Token Store screens

### Game Design Details

#### Factories
1. **Compressor Wheel Station** (Factory 1)
   - Unlocked by default
   - Base time: 10s → Min: 2s
   - HP/part: 150

2. **Turbo Assembly Station** (Factory 2)
   - Unlock cost: 500K HP (~1-2 hours active)
   - Base time: 60s → Min: 12s
   - HP/part: 3,500

3. **ECU Flashing Station** (Factory 3)
   - Unlock cost: 50M HP (~1 week idle)
   - Base time: 300s → Min: 60s
   - HP/part: 75,000

#### Tapping Mechanics
- Each tap reduces timer by 1 second
- Floor limit: base time / 5
- No tap rate limits (floor is the protection)

#### Offline Progress
- Capped at 6 hours (configurable via research)
- Server-side time validation (anti-cheat)
- Shows reward banner on return
- Never goes backwards or punishes

#### Economy
- **HP** is the only in-game currency
- **Double-product chance** (paid users only):
  - Free: 0%
  - Plus: 1.0%
  - Pro: 1.5%
  - Ultra: 2.0%

#### Research Tree (Paid Users Only)
9 research nodes across 3 tiers:
- Tier 1: Basic efficiency, factory specialists, speed boosts
- Tier 2: Advanced automation, lucky production
- Tier 3: Expert specialists, cost reduction, extended offline

#### HP → Token Conversions
- Small: 100K HP → 3 tokens
- Medium: 500K HP → 20 tokens (Featured)
- Large: 2M HP → 100 tokens

Designed to supplement, not replace token purchases.

## File Structure

```
/TunedUp
├── prisma/
│   └── schema.prisma (updated with Turbo Tycoon models)
├── lib/turboTycoon/
│   ├── gameConfig.ts
│   └── gameLogic.ts
├── api/
│   └── turbo-tycoon.ts
└── TunedUpNative/
    └── src/
        ├── types/
        │   └── turboTycoon.ts
        ├── services/
        │   └── turboTycoonApi.ts
        ├── components/turboTycoon/
        │   ├── HpDisplay.tsx
        │   └── FactoryCard.tsx
        ├── screens/
        │   ├── TurboTycoonScreen.tsx
        │   ├── TurboTycoonResearchScreen.tsx
        │   ├── TurboTycoonTokenStoreScreen.tsx
        │   └── ToolsScreen.tsx (updated)
        └── navigation/
            └── AppNavigator.tsx (updated)
```

## Database Updates
- Schema updated with 3 new models + 1 enum
- Successfully pushed to production database with `prisma db push`
- Prisma Client regenerated

## Testing Checklist

### Critical Tests Needed:
1. ✅ Database schema deployed
2. ⚠️ **Test game initialization** (first-time user)
3. ⚠️ **Test tapping mechanics** (tap factory, verify HP increase)
4. ⚠️ **Test offline progress** (close app, wait, reopen, verify reward)
5. ⚠️ **Test factory unlock** (accumulate HP, unlock Factory 2)
6. ⚠️ **Test factory upgrade** (verify level increase, cost scaling)
7. ⚠️ **Test research paywall** (free user sees upgrade CTA)
8. ⚠️ **Test research purchase** (paid user buys research)
9. ⚠️ **Test HP to token conversion** (verify tokens added, HP deducted)
10. ⚠️ **Test double-product chance** (paid users should see occasional doubles)
11. ⚠️ **Test sync interval** (verify game syncs every 5 seconds)
12. ⚠️ **Test navigation** (all screens accessible, back buttons work)

### Edge Cases to Test:
- User tries to unlock factory without enough HP
- User tries to buy research without prerequisites
- Time-cheat attempt (device time manipulation)
- Very long offline period (>6 hours)
- Concurrent taps on same factory
- Network failure during sync

## Known Limitations / Future Enhancements

### Current Implementation:
- Client-side countdown timers (visual only, server is source of truth)
- No animations for part completion or double-product events
- No sound effects
- Factory upgrade costs calculated client-side (should fetch from server)
- No user stats/leaderboard

### Potential Additions:
- Achievement system
- Special events/limited-time bonuses
- Factory skins/themes
- Prestige/reset mechanics
- Leaderboards
- Social features (visit friends' factories)
- Push notifications for offline progress

## Economy Specification v1 (BALANCED)

### Factory Base Values (Level 1)

| Factory | Production Time | HP/Part | HP/Min (Idle) | Unlock Cost | Base Upgrade Cost |
|---------|----------------|---------|---------------|-------------|-------------------|
| Compressor Wheel | 10s | 300 | 1,800 | 0 (default) | 2,000 |
| Turbo Assembly | 60s | 6,000 | 6,000 | 250,000 | 25,000 |
| ECU Flashing | 300s | 30,000 | 6,000 | 10,000,000 | 150,000 |

### Upgrade Scaling (Levels 1-10)

- **Power per level**: +10% multiplicative (1.10^(level-1))
  - Level 1: 1.00x base HP
  - Level 10: 2.36x base HP
- **Cost per level**: +12% multiplicative (1.12^(level-1))
  - Costs grow faster than power to prevent inflation
- **Max level**: 10 (hard cap)

### Tapping Mechanics

- **Tap effect**: -1 second per tap
- **Floor limit**: baseTime / 5 (prevents abuse)
  - Compressor: 2s minimum
  - Turbo Assembly: 12s minimum
  - ECU Flashing: 60s minimum

### HP → Token Conversion (WITH WEEKLY CAPS)

**Weekly Token Caps by Plan**:
- FREE: 20 tokens/week max
- PLUS: 30 tokens/week max
- PRO: 40 tokens/week max
- ULTRA: 50 tokens/week max

**Conversion Bundles** (with diminishing returns):

| Bundle | HP Cost | Tokens | HP/Token | Requires Factory |
|--------|---------|--------|----------|------------------|
| Small | 100,000 | 3 | 33,333 | Compressor (always) |
| Medium | 500,000 | 12 | 41,667 | Turbo Assembly |
| Large | 2,000,000 | 40 | 50,000 | ECU Flashing |

**Economic Protection**:
- Max 50 tokens/week even for Ultra users
- 50 tokens = 10 images = ~$0.39/week cost
- ≈ $1.56/month/user maximum from game rewards
- Bundles have worse HP efficiency for larger purchases (anti-farming)

### Research Node Costs (HP Sinks for Paid Users)

| Tier | HP Cost Range | Effect Examples |
|------|---------------|-----------------|
| 1 | 50K - 150K | +5% global HP, +5% factory-specific HP |
| 2 | 200K - 600K | +10% factory HP, -5% production time |
| 3 | 1M - 3M | +10% global HP, +1% double-product chance |

### Offline Progress & Anti-Cheat

- **Cap**: 6 hours maximum offline production
- **Time source**: Server time only (never client/device time)
- **Cheat protection**: If elapsed < 0 (time went backwards), grant 0 production
- **Tracking**: lastUpdatedAt stored per user, validated on each sync

## Design Decisions

### Why Single API Endpoint?
- Vercel has function limits
- Simpler to maintain
- Better for bundling related operations
- Action-based routing is clean and extensible

### Why BigInt for HP?
- Supports very large numbers (billions+)
- No floating-point precision issues
- Matches idle game expectations

### Why Server-Side Time?
- Prevents cheating via device time manipulation
- Ensures fair offline progress
- Source of truth for all calculations

### Why Weekly Token Caps?
- Prevents unlimited free token farming
- Protects economic viability (Gemini costs $0.039/image)
- Still rewards engaged players with meaningful bonuses
- Caps scale with paid plan tier as additional perk

### Why Diminishing Returns on Token Bundles?
- Larger bundles give worse HP/token ratio
- Discourages hoarding HP for mass conversions
- Encourages spending HP on upgrades/research instead
- Makes early small conversions feel rewarding

## Branding & Colors

Used existing TunedUp design system:
- Background: `#121212`
- Primary: `#00C2FF`
- Success (HP): `#00FF99`
- Turbo Tycoon gradient: `#10B981` → `#059669` (green theme for factory/industrial feel)

Factory gradients:
- Compressor: Blue (`#3B82F6` → `#06B6D4`)
- Turbo Assembly: Purple (`#8B5CF6` → `#EC4899`)
- ECU Flash: Orange/Red (`#F59E0B` → `#EF4444`)

## Next Steps

1. **Test the implementation** - Run through all critical tests listed above
2. **Tune the economy** - Adjust HP values, unlock costs, conversion rates based on real usage
3. **Add polish** - Animations, sound effects, haptic feedback
4. **Monitor metrics** - Track engagement, conversion rates, token redemption
5. **Iterate** - Add new factories, research nodes, or features based on feedback

## Questions/Support

If you encounter issues:
1. Check Vercel logs for API errors
2. Use React Native debugger for client-side issues
3. Verify Prisma Client is up to date (`npx prisma generate`)
4. Ensure environment variables are synced between local and Vercel

---

**Implementation Status**: ✅ Complete and ready for testing
**Database**: ✅ Deployed to production
**Estimated Development Time**: ~4-6 hours
**Lines of Code**: ~2,500+
