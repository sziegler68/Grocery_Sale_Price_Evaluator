## Architecture Stabilization Plan

### Objectives
- Establish a maintainable project structure that scales with upcoming feature growth.
- Centralize data/state management to eliminate duplicated fetch/subscribe logic.
- Decompose god components into smaller, testable units with clear responsibilities.
- Standardize API, notification, and subscription patterns for consistency across features.
- Introduce baseline automated testing and shared UI primitives.

### Phase 1 – Project Structure & Foundations
1. **Create `src/` layout**
   - `src/features/shopping-lists`, `src/features/shopping-trips`, `src/features/price-tracker`, `src/features/notifications`.
   - `src/shared/components`, `src/shared/hooks`, `src/shared/api`, `src/shared/types`, `src/shared/utils`.
   - Move files accordingly; update imports and path aliases.
2. **Shared types & utilities**
   - Consolidate duplicated interfaces (e.g., `GroceryItem`) into `shared/types`.
   - Promote unit conversion/price helpers into `shared/utils`.
3. **Dark mode/theme provider**
   - Wrap app with a provider built on `useDarkMode` hook to remove per-page toggles.

### Phase 2 – Data & State Management
1. **Adopt data/query layer**
   - Introduce TanStack Query (or Redux Toolkit Query/Zustand) for fetch + cache + optimistic updates.
   - Migrate `shoppingListApi`, `shoppingTripApi`, `groceryData` usages to query hooks.
2. **Encapsulate Supabase subscriptions**
   - Build hooks: `useListItemsSubscription`, `useNotificationsSubscription`, `useTripSubscription`.
   - Ensure consistent batching/throttling, cleanup, and error handling.
3. **Normalize notification service**
   - Separate throttling, RPC calls, and toast/browser notifications into distinct modules.

### Phase 3 – Component Decomposition & Shared UI
1. **Split mega components**
   - `ShoppingListDetail` → container hook (`useShoppingListDetail`) + presentational subcomponents (header, actions, grouped items, modals).
   - `ShoppingTripView`, `Settings`, `AddItemForm` follow same pattern.
2. **Create shared UI primitives**
   - Toast helper, modal wrapper, buttons/forms, loading skeletons in `shared/components`.
   - Replace ad hoc toasts and repeated markup.

### Phase 4 – API Consistency & Testing
1. **API client wrapper**
   - Centralize Supabase access with uniform error handling, logging, and mock fallbacks.
   - Define DTO ↔ domain mappers per feature.
2. **Automated tests**
   - Start with unit tests for utilities (price calc, notification throttling, budget status).
   - Add integration tests for new hooks and critical flows (list CRUD, trip completion).

### Phase 5 – Performance & Documentation
1. **Performance polish**
   - Measure render frequency; apply memoization or virtualization where needed.
   - Reassess optimistic update strategies post-refactor.
2. **Documentation & onboarding**
   - Record architecture decisions (ADR), coding standards, and contribution guide.
   - Update README/ROADMAP to align with new structure.

### Milestones & Sequencing
1. Structure refactor (Phase 1) – low risk, should ship first.
2. Data/state layer + subscriptions (Phase 2) – incremental per feature.
3. Component decomposition + shared UI (Phase 3) – follow feature migrations.
4. API normalization + testing (Phase 4) – run in parallel with Phase 3.
5. Performance/documentation (Phase 5) – wrap-up after baseline refactor.

Target timeline: 6–8 weeks part-time, with each phase deliverable via separate PRs.
