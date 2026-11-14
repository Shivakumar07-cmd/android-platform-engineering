---
title: Status and next steps
sidebar_position: 6
description: What is complete, what is pending, and the plan for team workflows.
---

# Status and next steps

## Completed

| Activity | Status |
|---|---|
| Ubuntu server setup | Done |
| Tailscale connectivity | Done |
| Gitea installation (native) | Done |
| PostgreSQL integration | Done |
| `Android_OS_Lab` organisation | Done |
| Migration of 1,087 repositories | Done |
| Manifest creation and push | Done |
| Verification of all 1,087 manifest SHAs | Passed |
| Fresh client `repo init` | Passed |
| Full 1,087-project client sync | Done |
| Client-side verification of every repository | Passed |
| Shallow clone verification | Passed |
| Clean Android 12 build from the Gitea checkout | Passed |
| Developer push and pull workflow | Done |
| Feature branches pushed to Gitea | Done |
| Pull requests raised for feature branches and merged to `main` | Done |

## Pending

- Migrating an existing developer checkout to the new manifest without downloading everything again
- Writing a standard migration procedure for the rest of the team
- Gitea teams and repository permissions
- Branch protection, so nobody pushes directly into shared integration branches and every change goes through a pull request

## Takeaways

- A private Gitea server with Tailscale gives a secure, controllable home for a full AOSP tree.
- Flattening repository names solves Gitea's naming limit without changing the checkout layout.
- Verifying every manifest SHA is cheap and removes the worry about a partial migration.
- Shallow sync keeps a fresh checkout affordable.
- A successful build from the new checkout is the strongest proof that the migration worked.
- The full loop works end to end: sync, build, branch, push, pull request and merge.
