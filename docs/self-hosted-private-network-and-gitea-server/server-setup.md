---
title: Server setup
sidebar_position: 2
description: Installing Ubuntu prerequisites, Tailscale, PostgreSQL and a native Gitea on the server.
---

# Server setup

The server runs Ubuntu 24.04 with Tailscale, PostgreSQL and a native (non-Docker) Gitea install.

:::note
Hostnames, addresses and passwords below are placeholders. Replace `GITEA_HOST` with your Tailscale machine name and `CHANGE_ME` with your own secrets.
:::

## Step 1: Prepare Ubuntu

```bash
sudo apt update
sudo apt install -y git python3 curl
```

Ubuntu must boot reliably before anything else. After a forced shutdown, mine needed boot repair (see [Issues and resolutions](./issues-and-resolutions.md)). Shut the machine down cleanly.

## Step 2: Install Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
tailscale ip -4
```

Use the Tailscale machine name in every Git and `repo` URL. The server's LAN IP changed once and broke access, which is why Tailscale replaced it.

## Step 3: Set up PostgreSQL

```bash
sudo apt install -y postgresql
sudo -u postgres psql
```

```sql
CREATE ROLE gitea WITH LOGIN PASSWORD 'CHANGE_ME';
CREATE DATABASE giteadb WITH OWNER gitea ENCODING 'UTF8';
```

Check that the role can log in:

```bash
psql -h 127.0.0.1 -U gitea giteadb
```

If this fails, look at the authentication rules in `pg_hba.conf` first.

## Step 4: Install Gitea (native binary)

Download the current release from the Gitea downloads page and use its version number.

```bash
wget -O gitea https://dl.gitea.com/gitea/VERSION/gitea-VERSION-linux-amd64
chmod +x gitea
sudo mv gitea /usr/local/bin/gitea
gitea --version
```

Create a dedicated user. Git over SSH goes through it, which is why URLs use `git@`.

```bash
sudo adduser --system --shell /bin/bash --gecos 'Git Version Control' \
  --group --disabled-password --home /home/git git
```

Create the directories with the right ownership. Wrong ownership here is a classic cause of a service that will not start.

```bash
sudo mkdir -p /var/lib/gitea/{custom,data,log}
sudo chown -R git:git /var/lib/gitea
sudo chmod -R 750 /var/lib/gitea

sudo mkdir /etc/gitea
sudo chown root:git /etc/gitea
sudo chmod 770 /etc/gitea
```

Put repository storage on a disk with plenty of free space, because 1,087 repositories are large.

## Step 5: Create the systemd service

Save this as `/etc/systemd/system/gitea.service`:

```ini
[Unit]
Description=Gitea
After=network.target postgresql.service

[Service]
RestartSec=2s
Type=simple
User=git
Group=git
WorkingDirectory=/var/lib/gitea/
ExecStart=/usr/local/bin/gitea web --config /etc/gitea/app.ini
Restart=always
Environment=USER=git HOME=/home/git GITEA_WORK_DIR=/var/lib/gitea

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now gitea
sudo systemctl status gitea
```

When Gitea does not start, read the journal. It names the failing config line or permission:

```bash
journalctl -u gitea -n 50 --no-pager
```

## Step 6: Run the web installer

Open `http://GITEA_HOST:3000` and set:

| Setting | Value |
|---|---|
| Database type | PostgreSQL |
| Host | `127.0.0.1:5432` |
| Username and database | `gitea` and `giteadb` |
| Server domain | The Tailscale name, **not** the LAN IP |
| Repository root path | A path on the large disk |

Create the administrator account, then lock down the config:

```bash
sudo chmod 750 /etc/gitea
sudo chmod 640 /etc/gitea/app.ini
```

## Step 7: Create the organisation and add SSH keys

In the Gitea web interface, create a **private** organisation called `Android_OS_Lab`. All repositories and the manifest live there.

Each developer adds a public SSH key to their Gitea account so `repo sync` runs without passwords:

```bash
ssh -T git@GITEA_HOST
```

## Checklist

- [ ] The Gitea web interface loads over the Tailscale name
- [ ] `ssh -T git@GITEA_HOST` succeeds
- [ ] Gitea survives a reboot
- [ ] A test repository can be created, cloned and pushed
