# Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants
1. A document inside `/workspaces/{workspaceId}` subcollections (`security`, `admins`, `projects`, `designers`, `movements`, `devices`) cannot be read or written unless the parent `/workspaces/{workspaceId}` document exists and the verified caller is listed in `memberEmails` or is the workspace owner / bootstrap admin (`bujasim@speakerbox.in`).
2. All document IDs (`workspaceId`, `adminId`, `projectId`, `designerId`, `movementId`, `deviceId`, `securityId`) must match `^[a-zA-Z0-9_\-]+$` and stay within `1..128` characters.
3. Unverified emails (`email_verified != true`) and unauthenticated callers are denied all reads and writes across all collections.
4. `createdAt`, `ownerUid`, and `workspaceId` are immutable after creation; `createdAt` and `updatedAt` must equal `request.time` on creation, and `updatedAt` must equal `request.time` on updates.
5. `memberEmails` and `allocatedAdminIds` are strictly bounded (`<= 20` items) and type-checked.
6. A `Project` in terminal status (`Completed`) cannot be mutated by non-owner members unless reopened by the workspace owner or bootstrap admin.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Read/Write**: `auth == null` reading `/workspaces/main/projects/proj-1` -> **PERMISSION_DENIED**.
2. **Unverified Email Spoof**: `auth.token.email == 'bujasim@speakerbox.in'`, `auth.token.email_verified == false` -> **PERMISSION_DENIED**.
3. **Ghost Field Shadow Update**: Updating a project with an extra unlisted key `{ isSuperAdmin: true }` -> **PERMISSION_DENIED** via `keys().hasOnly(...)` and `affectedKeys().hasOnly(...)`.
4. **Oversized ID Poisoning**: Creating `/workspaces/main/projects/${'a'.repeat(500)}` -> **PERMISSION_DENIED** via `isValidId()`.
5. **Invalid Regex ID**: Creating `/workspaces/main/projects/bad$id` -> **PERMISSION_DENIED** via `isValidId()`.
6. **Spoofed Owner UID on Create**: Creating a project with `ownerUid: 'someone-else'` -> **PERMISSION_DENIED** via `incoming().ownerUid == request.auth.uid`.
7. **Mutating Immutable `createdAt` / `ownerUid` on Update**: Sending a modified `createdAt` or `ownerUid` -> **PERMISSION_DENIED**.
8. **Client-Foraged Timestamp**: Creating a project with `createdAt: Timestamp.fromDate(new Date('2020-01-01'))` -> **PERMISSION_DENIED** via `incoming().createdAt == request.time`.
9. **Oversized String Denial-of-Wallet**: Sending `name` of 2,000 characters in `Project` -> **PERMISSION_DENIED** via `size() <= 150`.
10. **Unbounded Array Injection**: Sending `memberEmails` with 25 entries -> **PERMISSION_DENIED** via `size() <= 20`.
11. **Terminal State Mutation by Non-Owner**: Non-owner attempting to edit a `Completed` project -> **PERMISSION_DENIED**.
12. **Blanket List Query by Outsider**: Verified stranger (`outsider@example.com`) querying `collection(db, 'workspaces/main/devices')` -> **PERMISSION_DENIED** because `resource.data.memberEmails` does not contain their email.
