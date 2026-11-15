---
title: Overview
sidebar_position: 1
description: Why and how a full Android 12 source tree was moved to a private Gitea server reachable over Tailscale.
---

# Self-Hosted AOSP Source with Gitea

This section documents how I moved a complete Android 12 source tree, **1,087 Git projects** from the Radxa SDK, onto a private **Gitea** server. Developers reach the server over **Tailscale** and sync with the `repo` tool.

## Result at a glance

| Item | Result |
|---|---|
| Source | Android 12 tree, 1,087 projects |
| Host | Self-hosted Gitea on Ubuntu 24.04, PostgreSQL database |
| Access | Private network through Tailscale |
| Manifest | Rewritten for Gitea, with 2 copyfiles and 50 linkfiles preserved |
| Commit check | 1,087 of 1,087 manifest commit SHAs found in Gitea |
| Client sync | Fresh client synced all 1,087 projects with `--depth=1` |
| Verification | Every synced repository checked against the manifest |
| Build | Android 12 built successfully from the Gitea checkout |
| Workflow | Branches pushed to Gitea, pull requests raised and merged to `main` |

## Why self-host?

| Syncing from upstream | Syncing from our own Gitea |
|---|---|
| Depends on upstream availability | Internal server under our control |
| No private central hosting | Private `Android_OS_Lab` organisation |
| Hard to pin everyone to the same revisions | Version-pinned manifest |
| Limited access control | Gitea users, teams and permissions |
| No shared review workflow | Pull requests and branch protection possible |

## Architecture

![Architecture: developer laptops, Tailscale, and the Gitea server](@site/static/img/gitea-architecture-diagram.svg)

The original checkout (`/srv/aosp`) stays on the server. It was the source for the migration and for generating the manifest.

| Component | Role |
|---|---|
| Developer laptops | Check out and build the source locally |
| Tailscale | Secure private connectivity, so nobody depends on a LAN IP |
| Ubuntu server | Runs Gitea and PostgreSQL |
| Gitea | Hosts every repository and the manifest repository over SSH |

## Key concepts

**Manifest.** Android is not one repository. A manifest is an XML file listing every project, where to fetch it, which revision to use and where to place it in the source tree.

**`repo`.** The tool that reads the manifest and runs `init` and `sync` across all projects.

**Shallow repository.** A repository holding only recent history. On a tree this size it saves a lot of disk space and download time.

## In this section

1. [Server setup](./server-setup.md)
2. [Repository and manifest migration](./migration-and-manifest.md)
3. [Client sync and verification](./client-sync-and-verification.md)
4. [Issues and resolutions](./issues-and-resolutions.md)
5. [Status and next steps](./status-and-next-steps.md)
