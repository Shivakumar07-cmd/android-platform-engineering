---
title: Repository and manifest migration
sidebar_position: 3
description: Moving 1,087 projects into Gitea, flattening names, handling shallow repositories and writing the manifest.
---

# Repository and manifest migration

## Starting point

The source was an existing checkout at `/srv/aosp`. List every project:

```bash
cd /srv/aosp
repo list | wc -l      # 1,087 projects
```

## Flatten repository names

Gitea repository names cannot contain `/`, but Android project names do. I replaced `/` with `-`.

| Original project name | Gitea repository |
|---|---|
| `RKDocs/common` | `docs-common` |

This changes only the manifest `name`. The `path` stays the same, so the checkout on disk looks exactly as before.

## Migrate the repositories

I used scripts to automate the migration. The sketch below shows the logic, not the exact script I ran. For each project:

1. Create a private repository in `Android_OS_Lab` through the Gitea API.
2. Push its branches and tags.
3. If the push fails because the repository is shallow, unshallow it and push again.

```bash
# Illustrative only. Adapt names, paths and tokens.
NEW_NAME=$(echo "$REPO_PROJECT" | tr '/' '-')

curl -s -X POST \
  -H "Authorization: token $GITEA_TOKEN" \
  -H "Content-Type: application/json" \
  "http://GITEA_HOST:3000/api/v1/orgs/Android_OS_Lab/repos" \
  -d "{\"name\": \"$NEW_NAME\", \"private\": true}"

git remote add gitea "ssh://git@GITEA_HOST/Android_OS_Lab/$NEW_NAME.git"
git push gitea --all
git push gitea --tags
```

You can run a script like this across every project with `repo forall -c ./migrate-one.sh`.

### Shallow repositories

The source tree was largely shallow, and I wanted to avoid downloading full history for 1,087 projects. The result was mixed:

- Most repositories were pushed **shallow**, as they were.
- Where pushing a shallow repository failed, I pushed it **unshallowed** instead. That means fetching its full history from the original remote first:

```bash
git rev-parse --is-shallow-repository     # true if shallow
git fetch --unshallow ORIGINAL_REMOTE
git push gitea --all
```

The consequence is that Gitea holds a mix of shallow and full repositories. A client using `--depth=1` works against both.

## Write the manifest

An example of the structure (trimmed):

```xml
<manifest>
  <remote name="gitea" fetch="ssh://git@GITEA_HOST/Android_OS_Lab" />
  <default remote="gitea" revision="REVISION" sync-j="4" />

  <project name="docs-common" path="RKDocs/common" revision="40909de541c743a4a50bf23e2471acd4396ad275" />
  <!-- ... 1,087 projects in total ... -->
</manifest>
```

- `name` is the flattened Gitea repository name.
- `path` is the original location in the source tree.
- Revisions are pinned, so every developer gets identical sources.

### copyfile and linkfile

Some projects copy or link files into the tree. `repo` expands includes into one **effective** manifest, so this differs from the original manifest files. I checked the effective result and preserved **2 `copyfile` and 50 `linkfile`** entries.

### Push the manifest

The manifest goes into its own repository in the same organisation, with its own branch. Clients point `repo init` at it.
