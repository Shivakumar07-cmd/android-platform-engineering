---
title: Client sync and verification
sidebar_position: 4
description: Syncing from a fresh client and proving every commit, repository and file mapping is correct.
---

# Client sync and verification

## Sync from a fresh machine

On a clean machine with Tailscale running and an SSH key added to Gitea:

```bash
mkdir aosp && cd aosp
repo init -u ssh://git@GITEA_HOST/Android_OS_Lab/MANIFEST_REPO.git -b BRANCH --depth=1
repo sync -j4
```

`--depth=1` gives a shallow checkout, which keeps the download small.

## Verification 1: every manifest commit exists in Gitea

This proves no commit the manifest references went missing during the migration. The sketch below uses the Gitea API to check each pinned revision. It is illustrative, so adapt it.

```python
#!/usr/bin/env python3
import sys, urllib.request, urllib.error
import xml.etree.ElementTree as ET

API = "http://GITEA_HOST:3000/api/v1/repos/Android_OS_Lab"
TOKEN = "CHANGE_ME"

root = ET.parse(sys.argv[1]).getroot()
default = root.find("default")
default_rev = default.get("revision") if default is not None else None

projects = root.findall("project")
missing = 0
for p in projects:
    name = p.get("name")
    rev = p.get("revision") or default_rev
    req = urllib.request.Request(
        f"{API}/{name}/git/commits/{rev}",
        headers={"Authorization": f"token {TOKEN}"},
    )
    try:
        urllib.request.urlopen(req)
    except urllib.error.HTTPError as e:
        missing += 1
        print("MISSING", name, rev, e.code)

print(f"{len(projects) - missing} of {len(projects)} matched")
```

**Result: 1,087 of 1,087 commit SHAs matched.**

## Verification 2: representative projects

| Project | HEAD (first 12 characters) | Matches manifest |
|---|---|---|
| `RKDocs/common` | `40909de541c7` | Yes |
| `RKTools` | `8259b2360cb9` | Yes |
| `frameworks/base` | `9bb7e24f75bd` | Yes |
| `kernel-5.10` | `916c1eba1c22` | Yes |

These four were also confirmed shallow:

```bash
git rev-parse --is-shallow-repository
```

## Verification 3: full client sync

After the representative checks, the client synced **all 1,087 projects**. A script then compared every repository's checked-out commit with the commit the manifest expects. Something like:

```bash
repo list | wc -l       # expect 1087

repo forall -c '
  actual=$(git rev-parse HEAD)
  expected=$(git rev-parse "$REPO_LREV")
  [ "$actual" = "$expected" ] || echo "MISMATCH $REPO_PATH"
'
```

No mismatches were reported.

## Verification 4: copyfile and linkfile

Confirm that the effective manifest still carries **2 copyfile and 50 linkfile** entries, and that the copied files and links exist in the checkout.

```bash
grep -c "<copyfile" .repo/manifests/*.xml
grep -c "<linkfile" .repo/manifests/*.xml
```

## Verification 5: build

A clean **Android 12 build from the Gitea checkout completed successfully**. This was the last and most important check, because it shows that the whole chain works: server, manifest, sync and sources.
