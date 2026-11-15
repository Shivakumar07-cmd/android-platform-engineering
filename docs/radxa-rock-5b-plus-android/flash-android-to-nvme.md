---
title: Flash Android to the NVMe SSD
sidebar_position: 2
description: Flashing an Android 12 image to an NVMe SSD on the ROCK 5B+ in Maskrom mode with Linux_Upgrade_Tool.
---

# Flash Android to the NVMe SSD

After the microSD boot worked, I flashed Android to an NVMe SSD. The image goes onto the SSD from a Linux PC over a USB-C cable, with the board in **Maskrom mode**.

:::note
Radxa's NVMe guide uses `rsetup` and `dd` on the board and applies to **Radxa OS**. It does not apply to the Android image, so this page uses a different method.
:::

## How it works

```text
Linux PC  --USB-C cable-->  ROCK 5B+ (Maskrom mode)  -->  NVMe SSD
          upgrade_tool
```

You put the board in Maskrom mode **every time** you flash.

## Step 1: Enter Maskrom mode

1. Power the board off completely.
2. Remove the microSD card.
3. Hold the **Maskrom button**. You can find it on the [board diagram](./first-boot-from-microsd.md#the-board).
4. Connect a USB-C cable from the board to your laptop while holding the button.
5. Power on, then release the button after a couple of seconds.
6. Check from the PC:

```bash
lsusb
```

You should see a Rockchip device (ID `2207:350a` or similar). The flashing tool then lists it as Maskrom:

```text
DevNo=1  Vid=0x2207,Pid=0x350b,LocationID=101  Maskrom
```

## Step 2: Get the flashing tool

I used **Linux_Upgrade_Tool**:

```bash
git clone https://github.com/vicharak-in/Linux_Upgrade_Tool
cd Linux_Upgrade_Tool
sudo ./upgrade_tool LD
```

`LD` lists the connected devices. Your board should show up in Maskrom mode.

## Step 3: Flash the image

```bash
sudo ./upgrade_tool UF /path/to/update.img
```

My first flash used the official Radxa Android 12 image from the same [download page](https://docs.radxa.com/en/rock5/rock5b/download) as the microSD image:

```text
Rock5bplus-android12-rkr14-ssd-boot-20240705-update.img
```

Later I flashed my own build the same way, using the `update.img` that the build produces (see [Build output and flashing](./build-output-and-flashing.md)).

## Step 4: Boot from the SSD

1. Disconnect the USB-C cable.
2. Make sure the board is fully powered off.
3. Power on with the **12V/2A adapter**, not USB power. The RK3588 needs enough power for the SoC and the SSD to boot reliably.
4. The first Android boot is slow, so give it a minute or two before assuming it is stuck.

## Step 5: Confirm it booted from the SSD

```bash
adb shell cat /proc/cmdline
```

My output (serial number removed):

```text
storagemedia=nvme androidboot.storagemedia=nvme androidboot.mode=normal
androidboot.dtb_idx=0 androidboot.dtbo_idx=0 androidboot.verifiedbootstate=orange
androidboot.serialno=REDACTED console=ttyFIQ0 firmware_class.path=/vendor/etc/firmware
init=/init rootwait ro loop.max_part=7 androidboot.console=ttyFIQ0
androidboot.hardware=rk30board androidboot.boot_devices=fe150000.pcie
androidboot.selinux=permissive buildvariant=userdebug
```

What to look for:

- `storagemedia=nvme` and `androidboot.storagemedia=nvme` say the system storage is the NVMe SSD.
- `androidboot.boot_devices=fe150000.pcie` says the boot device sits on the PCIe controller.
- `buildvariant=userdebug` matches the `userdebug` target of the build.
- `androidboot.verifiedbootstate=orange` means verified boot reports an unlocked state, which is normal for a development image.

## Every reflash, the same sequence

1. Enter Maskrom mode
2. `sudo ./upgrade_tool LD`
3. `sudo ./upgrade_tool UF /path/to/update.img`

## What I tried first: rkdeveloptool

Rockchip's `rkdeveloptool` is the common starting point.

- `sudo apt install rkdeveloptool` **did not work for me**.
- Building it from source worked:

```bash
sudo apt-get update
sudo apt-get install -y libudev-dev libusb-1.0-0-dev dh-autoreconf pkg-config build-essential git wget
git clone https://github.com/rockchip-linux/rkdeveloptool
cd rkdeveloptool
autoreconf -i
./configure
make -j $(nproc)
sudo cp rkdeveloptool /usr/local/sbin/
```

It detected the board (`rkdeveloptool ld`) and loaded the bootloader (`db`). But its `uf` (upgrade firmware) command was reported as invalid in this version, so I switched to Linux_Upgrade_Tool, which flashed and booted fine.

*Linux_Upgrade_Tool is a third-party tool (from Vicharak). Check its source before running it with `sudo`.*
