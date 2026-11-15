---
title: First boot from a microSD card
sidebar_position: 1
description: Booting the official Radxa OS image from a microSD card on the ROCK 5B+ to check that the board works.
---

# First boot from a microSD card

Before flashing anything to NVMe, I booted the official **Radxa OS** image from a microSD card. This shows that the board, power supply and display work. This page covers only the essentials. Radxa's full guide is here: [Install the system on the microSD card](https://docs.radxa.com/en/rock5/rock5b/getting-started/install-os/boot_from_sd_card).

## The board

![Radxa ROCK 5B+ board diagram](@site/static/img/rock5b/rock5b-board-diagram.png)

## What you need

- ROCK 5B+ board and a power supply
- A microSD card and a card reader
- A PC (I used Windows for flashing the card)
- An HDMI display

## Step 1: Download the official image

Download the Radxa OS image from the [Radxa download page](https://docs.radxa.com/en/rock5/rock5b/download). The file is compressed, so **extract it first**. Etcher needs the `.img` file.

## Step 2: Connect and format the card

1. Put the microSD card in the card reader and plug the reader into the PC.
2. Format the card as **FAT32**. In my case this was required.

:::tip
The Windows format dialog does not offer FAT32 for cards larger than 32 GB. For a bigger card, use a tool that can format FAT32.
:::

## Step 3: Install balenaEtcher

balenaEtcher is a simple, cross-platform tool for writing images to cards. I used the Windows installer (`balenaEtcher-2.1.4.Setup.exe`) from the [balenaEtcher releases page](https://github.com/balena-io/etcher/releases/tag/v2.1.4). There is nothing to configure: double-click it to open.

## Step 4: Write the image

1. Open Etcher and click **Flash from file**, then pick the extracted image.

   ![Etcher: Flash from file](@site/static/img/rock5b/rock5a-step2.webp)

2. Click **Select target** and choose the card. **Check this carefully: the chosen drive is erased.**

   ![Etcher: Select target](@site/static/img/rock5b/rock5a-step3.webp)

3. Click **Flash!** and wait for the progress bar to finish.

   ![Etcher: Flash](@site/static/img/rock5b/rock5a-step4.webp)

4. Etcher shows **Flash Complete!** when it is done. If flashing fails, try again.

   ![Etcher: Flash Complete](@site/static/img/rock5b/rock5a-step5.webp)

## Step 5: Boot

Insert the card into the microSD slot on the board.

![microSD slot on the ROCK 5B+](@site/static/img/rock5b/rock5b-interface-2.webp)

Then power on:

- The power LED turns **solid green**, so the system is booting.
- When startup completes, the LED **blinks**.
- After a short wait, the HDMI display shows the desktop. The whole process takes about 40 seconds.

Log in with user `radxa` and password `radxa`.

*Etcher screenshots and the microSD slot photo: [Radxa Docs](https://docs.radxa.com), © Radxa Computer (Shenzhen) Co., Ltd., licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).*
