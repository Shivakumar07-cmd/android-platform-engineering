---
title: Issues and resolutions
sidebar_position: 5
description: Every problem hit while setting up and migrating, with cause and fix.
---

# Issues and resolutions

## Summary

| # | Issue | Cause | Resolution |
|---|---|---|---|
| 1 | Ubuntu server would not boot properly | Boot configuration damaged after a forced shutdown | Restored boot access |
| 2 | Gitea service would not start | Configuration, service and permission problems | Corrected the application configuration and service setup |
| 3 | Gitea could not connect to PostgreSQL | Database configuration and authentication | Configured database access for Gitea |
| 4 | Server LAN IP changed | Dynamic address from the network | Adopted Tailscale |
| 5 | Old Tailscale server unavailable | Account and network reset | Reconnected the server with a new Tailscale address |
| 6 | Repository names rejected | Android project names contain `/` | Flattened names, replacing `/` with `-` |
| 7 | Shallow repositories failed to push | Pushing from shallow clones to Gitea produced errors | Unshallowed those repositories and pushed again; the rest stayed shallow |
| 8 | Manifest showed zero projects | No project working trees were synced yet | Checked the expanded manifest and continued with the sync |
| 9 | Worry about missing commits | A migration can silently skip objects | Verified all 1,087 manifest SHAs against Gitea |
| 10 | Avoiding full-history downloads | Shallow repositories needed to stay shallow where possible | Verified shallow state and synced the client with `--depth=1` |
| 11 | Manifest differed from the original | `repo` resolves includes into an effective manifest | Preserved the effective 2 copyfiles and 50 linkfiles |

## Details

### 1. Server would not boot

After a forced shutdown, the Ubuntu server's boot configuration was damaged and I had to restore boot access before anything else could continue. Shut servers down cleanly, and keep a way to reach the console.

### 2. Gitea would not start

With a native install, this usually comes from one of the following:

- `/var/lib/gitea` or `/etc/gitea` not owned by the `git` user
- A wrong path in `ExecStart` or `--config` in the service file
- `app.ini` not readable by `git`
- PostgreSQL not running yet, or a wrong password in `app.ini`

Run `journalctl -u gitea -n 50 --no-pager`. The log names the exact problem.

### 3. PostgreSQL connection

Gitea needs its own database role and database with matching credentials in `app.ini`. If the login fails, check `pg_hba.conf` authentication rules and test with `psql -h 127.0.0.1 -U gitea giteadb`.

### 4 and 5. Network address problems

The LAN IP of the server changed, which broke every URL that used it. Tailscale gave the server a stable name. Later, the old Tailscale server entry became unavailable after an account and network reset, so I reconnected the server and updated clients to the new address. Anything that stores the old address, such as Git remotes and manifest URLs, must be updated when this happens.

### 6. Repository names

Gitea does not allow `/` in repository names. Flattening names in Gitea and keeping the original `path` in the manifest solves this without changing the checkout layout.

### 7. Shallow repositories

Some shallow repositories could not be pushed to Gitea. For those, I fetched the full history and pushed them unshallowed. The final Gitea instance therefore holds a mix of shallow and full repositories.

### 8. Manifest with zero projects

The manifest appeared to list no projects because nothing had been synced into a working tree yet. This was a state problem, not a manifest problem.

### 9 and 10. Completeness and size

I verified every manifest commit SHA against Gitea instead of assuming the migration was complete, and kept clients on `--depth=1` to avoid unnecessary full-history downloads.

### 11. Effective manifest

`repo` expands includes into one resolved manifest, so the resolved result is not identical to the original files. I verified that the effective manifest kept the **2 copyfile** and **50 linkfile** entries.
