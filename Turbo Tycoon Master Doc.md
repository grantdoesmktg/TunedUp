TURBO TYCOON – GAME SPEC & IMPLEMENTATION GUIDE

You are implementing a self-contained idle/factory mini-game called Turbo Tycoon inside the existing TunedUp app.

The goal is to build a clean, maintainable module that can be iterated on later without tangling with the rest of the codebase.

1. HIGH-LEVEL OVERVIEW

Core fantasy:
User runs a turbo/performance parts factory. Factories produce parts over time; each completed part yields HP (Horsepower Points). HP is the only currency.

Key loop:

Factories automatically produce parts over time (idle income).

User taps to reduce production timers and complete parts faster.

Each produced part gives HP and increments lifetime part stats.

HP is spent to:

Upgrade factories (faster production, more HP/part, etc.)

Unlock new factories

Buy research nodes (paid users only)

Convert HP → TunedUp tokens (for AI tool usage).

Paid users (Plus/Pro/Ultra) have advantages (double-product chance + research tree).

Strict design requirements:

No XP. HP is the only currency.

No multipliers or temporary buff timers. Tapping directly speeds up production.

Factories cost HP to unlock, creating trade-off between:

cashing out HP into tokens now

or investing HP into better long-term production

Offline progress is capped at 6 hours and must be time-cheat resistant.

All logic must be isolated from the rest of the TunedUp app in a dedicated module/folder structure.

2. TECH & ORGANIZATION REQUIREMENTS

Assume:

Next.js (App Router)

TypeScript

Prisma + Postgres (or similar)

Existing User model and token system already in the app

Existing subscription/plan system with tiers: Free, Plus, Pro, Ultra

2.1. File Structure (Guideline)

Please keep Turbo Tycoon code clearly separated from the rest of the app:

app/turbo-tycoon/ – all routes/UI for the game:

page.tsx – main dashboard (factories overview)

research/page.tsx – research nodes

store/page.tsx – HP → token conversions

stats/page.tsx – user’s all-time stats (optional)

lib/turboTycoon/ – game logic/helpers:

gameConfig.ts – constants (factory base times, floors, HP/part, costs, etc.)

gameLogic.ts – functions for production, tapping, offline progress, etc.

research.ts – research tree definitions and effects

components/turboTycoon/ – game UI components:

FactoryCard.tsx

ProductionTimer.tsx

HpBar.tsx

ResearchNodeCard.tsx

TokenConversionPanel.tsx

Prisma: keep models in schema.prisma, but name them clearly (TurboFactoryProgress, TurboResearchNode, etc.)

You have flexibility in exact naming and organization, but please keep Turbo Tycoon fully in its own namespace.

3. GAME DESIGN DETAILS
3.1. Currency

HP (Horsepower Points) is the only in-game currency.

HP is used for:

Factory upgrades

Unlocking new factories

Buying research nodes

Converting HP → TunedUp tokens

Numbers should be large and satisfying. Avoid small values like 5 or 10 HP; start in the hundreds or thousands.

3.2. Factories

Three factories:

Compressor Wheel Station (Factory 1 – early game; unlocked by default)

Turbo Assembly Station (Factory 2 – mid game)

ECU Flashing Station (Factory 3 – late game)

Each factory has:

baseProductionTimeSeconds – time needed to produce one part without tapping

minimumTimeFactor – global factor: 1/5 (minimum time = base time / 5)

hpPerPart – HP rewarded per produced part

unlockCostHp – HP cost to unlock the factory

level and upgrade cost scaling

hpPerMinute computed for display

You can design internal formulas, but stay true to these design constraints:

Factory 1 – Compressor Wheel Station

Unlocked by default

Base production time: 10 seconds

Minimum time (floor): 2 seconds (10 / 5)

Tap effect: each tap = −1 second from the current timer (until floor)

HP per part: start around 150 HP (tune as needed)

Factory 2 – Turbo Assembly Station

Unlock target:

After ~1–2 hours of active tapping or

~1 day of idle play

Start with:

Base production time: 60 seconds

Minimum time: 12 seconds (60 / 5)

Tap effect: −1s per tap, capped by floor

HP per part: in the thousands (e.g. 2,000–5,000 HP)

Unlock cost: sizable HP (e.g. mid-hundreds of thousands to low millions), tuned so it roughly matches the play time goals above

Factory 3 – ECU Flashing Station

Unlock target:

After ~1 week of mostly idle play or

~1–2 full days of consistent active play

Suggested starting values:

Base production time: 300 seconds (5 minutes)

Minimum time: 60 seconds (300 / 5)

Tap effect: −1s per tap, capped by floor

HP per part: large (tens of thousands to hundreds of thousands HP)

Unlock cost: high (tens of millions of HP), tuned to hit the target timeline

3.3. Tapping Logic

For each factory:

There is an internal currentCycleRemainingSeconds.

Every second (or at fixed, coarse intervals), you reduce this based on:

Idle progression

Manual taps

Manual tapping:

Each tap reduces currentCycleRemainingSeconds by 1 second, but not below:

floorTime = baseProductionTimeSeconds / 5
currentCycleRemainingSeconds >= floorTime


You can cap taps per second if needed for stability, but the main protection is the floor.

When currentCycleRemainingSeconds <= 0:

Produce 1 part:

Add HP (hpPerPart * any relevant research bonuses)

Increment lifetime part count

Check double-product chance (paid users only; see below)

Reset currentCycleRemainingSeconds to the current baseProductionTimeSeconds (which may have been reduced by upgrades).

3.4. Offline Progress & Anti-Cheat

We must:

Allow offline progress

Limit offline progress to 6 hours

Prevent device time cheating

Key principle:
Use server time, not device time, for production calculations.

For each user, store (per factory):

lastUpdatedAt (server timestamp)

currentCycleRemainingSeconds

Any other needed state (e.g. accumulated HP in that cycle)

On load or when resuming the game:

Fetch current server time.

Compute:

elapsed = nowServer - lastUpdatedAt


If elapsed < 0 (time went backwards in comparison to last update):

Treat as suspicious; do not grant additional production.

Optionally:

Set elapsed = 0

Update lastUpdatedAt = nowServer

Never punish HP, just ignore the fake elapsed time.

Cap offline duration to 6 hours per resume:

effectiveElapsed = min(elapsed, 6 hours)


For each factory, simulate production over effectiveElapsed, using its baseProductionTimeSeconds and current upgrade stats:

Add parts as if time had passed normally

Apply the same rules as online production (no tapping, obviously)

Update HP & lifetime counts

Adjust currentCycleRemainingSeconds accordingly

Set lastUpdatedAt = nowServer at the end of processing.

Additionally, consider a global daily cap for offline HP to further protect from manipulation, but the 6-hour cap + server time should be sufficient.

4. ECONOMY & TOKEN INTEGRATION
4.1. HP as the Only Currency

All in-game decisions, upgrades, unlocks, and research are paid in HP.

There is no separate “XP” or premium in-game currency.

Big numbers are encouraged:
Players should feel like they are generating tens of thousands, then millions of HP.

4.2. Factory Unlocks & Upgrades (HP Sinks)

Each factory:

Has an unlockCostHp (except Factory 1 which is free).

Has a level and an upgradeCostHp.

Costs should scale such that:

Choosing to unlock or upgrade feels like a meaningful sacrifice:

“Do I want more production in the future, or do I convert this HP to tokens now?”

This is intentional: once a user spends HP on a factory unlock, they are mentally and emotionally invested in the game.

4.3. HP → Token Conversion

Tokens are used elsewhere in the TunedUp app, where:

1 image generation = 5 tokens

Plan pricing (already set):

$5 → 100 tokens

$10 → 250 tokens

$15 → 500 tokens

Design HP → token conversion such that:

The game never replaces buying tokens.

It feels like a nice bonus for engaged users.

Reasonable target:

A very engaged player might earn enough HP for a small number of images per week, not dozens.

Implementation idea:

Have several conversion tiers in the in-game “Token Store”:

Example (numbers are placeholders and should be tuned during implementation):

Option A: Spend 100,000 HP → get 3 tokens
Option B: Spend 500,000 HP → get 20 tokens
Option C: Spend 2,000,000 HP → get 100 tokens


Make conversions feel chunky and meaningful, but still costly relative to paid token packs.

It is okay if these feel “expensive” — they are rewards for commitment, not a main token source.

Store the actual conversion rates in a config (lib/turboTycoon/gameConfig.ts) so they can be tuned easily.

5. PAID PLAN PERKS

Plan tiers (already exist in app):

Free

Plus

Pro

Ultra

Use the existing subscription/plan system to determine user tier.

5.1. Double-Product Chance

On each completed part (per factory), check for double output:

Free: 0%

Plus: 1.0% chance

Pro: 1.5% chance

Ultra: 2.0% chance

If proc:

Give:

+1 extra part (effectively 2 parts total)

Add HP for both parts

Increment lifetime part count by 2, not 1

This mechanic:

Feels exciting and rewarding

Meaningfully boosts HP generation for paid plans

Does not break the game

Store this logic in a single helper function, e.g.:

function getDoubleProductChance(plan: PlanTier): number { ... }

5.2. Research Tree – Paid Users Only

Only paid users (Plus, Pro, or Ultra) can access the Research Tree.

Free users:

See a modal indicating research is locked.

Modal should include existing upgrade/plan upsell UI.

Paid users:

See research nodes and can purchase upgrades with HP.

The Research Tree should:

Use HP as cost.

Require “previous tier” before next (simple linear or branched tree).

Provide real, but not game-breaking advantages.

Suggested types of research effects:

Increase hpPerPart for specific factories (e.g. +10% Compressor HP).

Reduce baseProductionTimeSeconds by a small percentage (e.g. −5%).

Slightly increase double-product chance for paid users.

Increase maximum offline cap for the game (e.g. from 6h to 7–8h) – optional.

Slightly reduce upgrade costs (e.g. −5% HP cost per level).

Keep the effects simple and numeric. You can organize them in a config array like:

const RESEARCH_NODES = [
  {
    id: 'basic-efficiency-1',
    tier: 1,
    costHp: 50000,
    effect: { globalHpPerPartMultiplier: 1.05 },
    requires: null,
  },
  {
    id: 'compressor-specialist-1',
    tier: 1,
    costHp: 75000,
    effect: { compressorHpPerPartMultiplier: 1.10 },
    requires: null,
  },
  {
    id: 'advanced-automation',
    tier: 2,
    costHp: 250000,
    effect: { globalBaseTimeMultiplier: 0.95 },
    requires: ['basic-efficiency-1'],
  },
  // etc...
];


You have flexibility, just keep it:

HP-paid

Tier-gated

Paid-plan gated

6. DATA MODEL (PRISMA SKETCH)

You can adjust naming, but aim for something like this.

model User {
  id                      String                  @id @default(cuid())
  // existing fields...

  turboTycoonState       TurboTycoonState?
  turboFactoryProgresses TurboFactoryProgress[]
  turboResearchOwnership TurboResearchOwnership[]
}

enum TurboFactoryType {
  COMPRESSOR
  TURBO_ASSEMBLY
  ECU_FLASH
}

model TurboTycoonState {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id])

  totalHp           BigInt   @default(0) // total HP user currently has available
  lifetimeHpEarned  BigInt   @default(0) // for stats
  lifetimePartsMade BigInt   @default(0)

  lastUpdatedAt     DateTime // server timestamp of last production update
}

model TurboFactoryProgress {
  id                          String           @id @default(cuid())
  userId                      String
  user                        User             @relation(fields: [userId], references: [id])

  factoryType                 TurboFactoryType

  isUnlocked                  Boolean          @default(false)
  level                       Int              @default(1)
  totalPartsProduced          BigInt           @default(0)

  // Remaining seconds in the current production cycle
  currentCycleRemainingSeconds Int              @default(0)

  // Optional: track last production update per factory, or rely on TurboTycoonState.lastUpdatedAt
}

model TurboResearchOwnership {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  researchKey   String   // matches RESEARCH_NODES ids
  acquiredAt    DateTime @default(now())
}


Notes:

Use BigInt for HP so large numbers are safe.

You may also want a TurboHpTransaction log model if you want detailed audit; not required for V1.

7. CORE LOGIC (PSEUDO-FLOW)
7.1. Loading the Game

On /turbo-tycoon page load:

Fetch:

current user

plan/tier

TurboTycoonState

TurboFactoryProgress[]

TurboResearchOwnership[]

Run a server action or API endpoint to:

Get server now time

Apply offline production (using 6h cap, anti-cheat rules)

Return updated HP, factory states, etc.

Render UI with updated data.

7.2. Producing Parts (Online)

Triggered via server actions called on:

Taps

A periodic “sync” (e.g. user pressing a “Sync production” button or whenever they navigate between views).

Key server logic (per factory):

function applyTimeAndTapsToFactory(
  factory: TurboFactoryProgress,
  elapsedSeconds: number, // from lastUpdatedAt or last sync
  tapsSinceLastSync: number,
  config: FactoryConfig,          // base time, hpPerPart, etc.
  researchEffects: ResearchEffects,
  planTier: PlanTier,
): ProductionResult {
  // 1) adjust base time by research
  const effectiveBaseTime = config.baseProductionTimeSeconds * researchEffects.baseTimeMultiplier;
  const floorTime = effectiveBaseTime / 5;

  let remaining = factory.currentCycleRemainingSeconds || effectiveBaseTime;

  // 2) apply elapsed time (idle)
  remaining -= elapsedSeconds;
  // 3) apply tap time reduction
  remaining -= tapsSinceLastSync; // 1 sec per tap
  // 4) enforce floor
  if (remaining < floorTime) remaining = floorTime;

  let hpGained = 0n;
  let partsProduced = 0n;

  // 5) handle full cycles completed
  while (remaining <= 0) {
    // produce part
    const hpPerPartEffective = calculateHpPerPart(config, researchEffects);
    const doubleChance = getDoubleProductChance(planTier);
    const isDouble = rollRandom(doubleChance);

    const parts = isDouble ? 2n : 1n;

    hpGained += BigInt(hpPerPartEffective) * parts;
    partsProduced += parts;

    // reset cycle
    remaining += effectiveBaseTime; // next cycle
  }

  // return updated state
  return {
    updatedRemainingSeconds: Math.round(remaining),
    hpGained,
    partsProduced,
  };
}


This is conceptual; you can optimize as needed.

7.3. Unlocking Factories

Check user has enough HP.

Deduct unlockCostHp.

Set isUnlocked = true, level = 1, and initial currentCycleRemainingSeconds = baseTime.

7.4. Upgrading Factories

Compute upgradeCostHp based on level (e.g. exponential or quadratic growth).

Deduct HP if enough.

Increase level.

Adjust relevant stats (HP/part, production time, etc.) through configuration or research.

8. UI REQUIREMENTS

High-level UI expectations:

Main Turbo Tycoon page:

Overview of:

Total HP (big number, formatted with commas)

Lifetime HP

Lifetime parts

Cards for each factory:

Lock state or active state

Factory name & icon

“HP per part” value

“Estimated HP per minute”

Progress bar showing current production cycle

“Tap to speed up” area (button or tapable card)

“Unlock” button if locked

“Upgrade” button with cost

Research page:

If free: show paywall / upgrade modal

If paid: grid/list of research nodes with:

name

cost HP

effect summary

lock/unlock state

Token Store page:

Show current HP and current tokens

List conversion options with:

HP cost

tokens gained

Confirm modal for purchases

Use simple, minimal graphics and light animations (no need for heavy visual work in V1).

9. IMPORTANT IMPLEMENTATION NOTES FOR THE AI

Keep Turbo Tycoon code isolated in its own routes, components, and lib files as described above.

Do not modify unrelated parts of the app unless necessary (e.g. reading user plan, token balances).

Centralize configuration in a small set of TypeScript files:

Factory definitions

Research node definitions

HP → token conversion table

Use server actions where appropriate for:

Applying offline progress

Handling taps/production updates

Unlocking/upgrading factories

Doing HP → token conversions

Avoid premature complexity:

No audio in V1

No multi-currency

No overly complex research branching

Make sure numbers are:

Intuitive to read (format with commas)

Large enough to feel satisfying

That’s the full scaffolding and vision.

You now understand the design, the economy, and the structural expectations.
Please implement Turbo Tycoon as a self-contained module that plugs into the existing TunedUp user, token, and subscription systems, following the above spec.
