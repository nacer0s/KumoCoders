# User Profile Settings Expansion

## Goal
Add comprehensive user settings: profile/privacy, content/feed, notifications, display/accessibility, and account/safety controls.

## Phases

### Phase 1: Database & API
- [ ] Create `user_settings` table (JSON column or individual columns)
- [ ] Create create GET/PUT `/api/community/settings` endpoints
- [ ] Create `muted_users` table + GET/POST/DELETE endpoints
- [ ] Create `/api/community/export` endpoint
- [ ] Create `/api/community/sessions` endpoints (list/revoke)

### Phase 2: Frontend UI
- [ ] Build expanded Settings page with all sections
- [ ] Profile & Privacy section
- [ ] Content & Feed section
- [ ] Notifications section
- [ ] Display & Accessibility section
- [ ] Account & Safety section

### Phase 3: Backend Enforcement
- [ ] Profile visibility checks on user profile endpoints
- [ ] Comment/permission checks
- [ ] NSFW blur logic
- [ ] Muted users filtering
- [ ] Online status control

### Phase 4: Frontend Consumption
- [ ] Respect settings in profile page (visibility, banne, etc.)
- [ ] Respect settings in feed/post rendering (NSFW, density)
- [ ] Respect muted users
- [ ] Respect online status

## Progress
- Phase 1: Not started
- Phase 2: Not started
- Phase 3: Not started
- Phase 4: Not started

## Next Step
Create user_settings table migration and API endpoint
