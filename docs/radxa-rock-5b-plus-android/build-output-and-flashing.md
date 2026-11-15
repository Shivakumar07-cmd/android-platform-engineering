---
title: Build output and flashing your build
sidebar_position: 5
description: What the ROCK 5B+ Android build produces in rockdev and how to flash update.img to the board.
---

# Build output and flashing your build

## What the build produces

```text
~/Rock5BPlus/rockdev/Image-RadxaRock5BGen2/
```

| File | Size | Typical role |
|---|---|---|
| `update.img` | 1.8 GB | The packed image I flash to the board |
| `super.img` | 1.7 GB | Android system, vendor and product partitions |
| `gpt.img` | 6.6 GB | Full disk image with the partition table |
| `boot.img` | 38 MB | Kernel and ramdisk |
| `boot-debug.img` | 38 MB | Debug variant of the boot image |
| `recovery.img` | 102 MB | Recovery system |
| `dtbo.img` | 443 bytes | Device tree overlays |
| `vbmeta.img` | 4 KB | Verified-boot metadata |
| `resource.img` | 357 KB | Boot resources (logo, device tree) |
| `idbloader.img` | 308 KB | Early boot loader (DDR init and SPL) |
| `uboot.img` | 5 MB | U-Boot bootloader |
| `MiniLoaderAll.bin` | 470 KB | Loader used by Rockchip flashing tools |
| `parameter.txt` | 579 bytes | Partition layout |
| `misc.img`, `baseparameter.img` | 48 KB, 1 MB | Boot control and display parameters |
| `config.cfg` | 6 KB | Packaging configuration |

## Flash your own build

Use the same procedure as in [Flash Android to the NVMe SSD](./flash-android-to-nvme.md), with your own `update.img`:

```bash
# put the board in Maskrom mode first
sudo ./upgrade_tool LD
sudo ./upgrade_tool UF ~/Rock5BPlus/rockdev/Image-RadxaRock5BGen2/update.img
```

Then power-cycle with the 12V adapter and let the first boot finish.

This build boots from NVMe because of the board configuration change in [Step 4 of the build](./build-android-12.md#step-4-enable-nvme-boot-and-root-access).

Confirm the result with `adb shell cat /proc/cmdline`.
