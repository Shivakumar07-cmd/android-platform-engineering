---
title: Build Android 12 from source
sidebar_position: 3
description: Syncing the Radxa Android 12 source, installing host packages and running the full ROCK 5B+ build.
---

# Build Android 12 from source

This is how I built Android 12 for the ROCK 5B+ (RK3588) from the Radxa source tree.

## Overview

| Item | Value |
|---|---|
| Source | Radxa manifests, branch `Android12_RK3588_Radxa_rk12`, manifest `rockchip-s-release.xml`, later my own Gitea server |
| Target | `RadxaRock5BGen2-userdebug` |
| Kernel | `kernel-5.10`, `rk3588-rock-5b-gen2_defconfig` |
| Build script | `./build.sh -UACKup` |
| Board configuration | NVMe boot and root access enabled in `device/rockchip/rk3588` (Step 4) |
| Build machine | Ubuntu 24.04, 9 CPU cores, 32 GB RAM, 100 to 200 GB of free disk |

The build is made of several parts:

| Part | Role |
|---|---|
| Android build system (Soong, Ninja) | Framework, native libraries, apps |
| `kernel-5.10` | Linux kernel |
| `u-boot` | Bootloader |
| `rkbin` | Rockchip firmware blobs |
| `mkimage.sh` | Packs the firmware images |
| `rockdev` | Output folder |

## Step 1: Sync the source

At first I synced from Radxa's manifests at [github.com/radxa/manifests](https://github.com/radxa/manifests), branch `Android12_RK3588_Radxa_rk12`:

```bash
mkdir ~/Rock5BPlus && cd ~/Rock5BPlus
repo init -u https://github.com/radxa/manifests.git \
  -b Android12_RK3588_Radxa_rk12 \
  -m rockchip-s-release.xml
repo sync -c -j2 --force-sync --no-tags --prune --detach
```

The manifest file is [`rockchip-s-release.xml`](https://github.com/radxa/manifests/blob/Android12_RK3588_Radxa_rk12/rockchip-s-release.xml) on that branch.

After I set up my own Gitea server, I synced from it instead and built from that checkout. The setup is described in [Self-hosted source with Gitea](../self-hosted-private-network-and-gitea-server/overview.md).

## Step 2: Install host packages

```bash
sudo apt update
sudo apt install build-essential git gnupg flex bison gperf zip curl zlib1g-dev \
  gcc-multilib g++-multilib libc6-dev-i386 lib32ncurses-dev x11proto-dev \
  libx11-dev lib32z1-dev libgl1-mesa-dev libxml2-utils xsltproc unzip fontconfig \
  python3 python-is-python3 libssl-dev libncurses5

sudo apt install gcc-aarch64-linux-gnu binutils-aarch64-linux-gnu
```

`libncurses5` is not available from the standard repositories on newer Ubuntu releases, so I installed it by hand (see issue 2 on the [issues page](./build-issues-and-fixes.md)).

## Step 3: Set up the build environment

```bash
cd ~/Rock5BPlus
source build/envsetup.sh
lunch RadxaRock5BGen2-userdebug
```

## Step 4: Enable NVMe boot and root access

By default, the device configuration boots from the board's MMC controllers. To boot Android from an NVMe SSD, I changed the board configuration in the `device/rockchip/rk3588` repository and committed it there as a patch ("Support NVME boot on RadxaRock5BGen2"). Do this **before** the full build.

### `device/rockchip/rk3588/BoardConfig.mk`

```diff
 PRODUCT_KERNEL_VERSION := 5.10
+TARGET_KERNEL_SOURCE := kernel-5.10
 
 ...
 #spi+nvme boot
-BOARD_USES_SPI_NVME_BOOT := false
+BOARD_USES_SPI_NVME_BOOT := true
 
 # root permissions
-BOARD_USES_ROOT_PERMISSION ?= false
+BOARD_USES_ROOT_PERMISSION ?= true
```

### `device/rockchip/rk3588/RadxaRock5BGen2/BoardConfig.mk`

```diff
 #spi+nvme boot
-BOARD_USES_SPI_NVME_BOOT := false
+BOARD_USES_SPI_NVME_BOOT := true
 
 ...
 PRODUCT_KERNEL_DTS := rk3588-rock-5b-gen2
+BOARD_KERNEL_DTB := rk3588-rock-5b-gen2.dtb
+BOARD_PREBUILT_DTBIMAGE_DIR := kernel-5.10/arch/arm64/boot/dts/rockchip
+BOARD_PREBUILT_DTBOIMAGE :=
+BOARD_BUILD_DTBO_IMAGE := false
+BOARD_INCLUDE_DTB_IN_BOOTIMG := true
```

### What the changes do

| Setting | Purpose |
|---|---|
| `BOARD_USES_SPI_NVME_BOOT := true` | Switches the build to NVMe boot. When it is `false`, the boot device is the MMC controllers (`fe2c0000.mmc`, `fe2e0000.mmc`). |
| `BOARD_USES_ROOT_PERMISSION ?= true` | Enables root access. Use this for development builds only. |
| `TARGET_KERNEL_SOURCE := kernel-5.10` | Points the build at the `kernel-5.10` source directory. |
| `BOARD_KERNEL_DTB`, `BOARD_PREBUILT_DTBIMAGE_DIR` | Take the board's device tree binary from the kernel build output. |
| `BOARD_PREBUILT_DTBOIMAGE`, `BOARD_BUILD_DTBO_IMAGE := false` | No separate DTBO image is built. |
| `BOARD_INCLUDE_DTB_IN_BOOTIMG := true` | Packs the device tree binary into `boot.img`. |

The board configuration also lists the kernel config fragments the Android build uses (I did not change this line):

```make
PRODUCT_KERNEL_CONFIG := rockchip_defconfig android-11.config rock5b_gen2.config
PRODUCT_KERNEL_CONFIG += rtl8125.config bcm_sdio_wifi.config
```

After flashing this build, the boot command line shows the system running from NVMe (`androidboot.storagemedia=nvme`, `androidboot.boot_devices=fe150000.pcie`). See [Confirm it booted from the SSD](./flash-android-to-nvme.md#step-5-confirm-it-booted-from-the-ssd).

## Step 5: Build the kernel on its own (optional)

```bash
cd kernel-5.10
make ARCH=arm64 rk3588-rock-5b-gen2_defconfig
make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- -j$(nproc)
```

If the compiler complains, see the Clang issue on the [issues page](./build-issues-and-fixes.md).

## Step 6: Full build

```bash
./build.sh -UACKup | tee build.log
```

`tee` saves the full log, which helps a lot when a build fails late. To see what each flag does, run `./build.sh -h`.

The result is a folder of images in `rockdev/Image-RadxaRock5BGen2/`, including `update.img` (see [Build output and flashing](./build-output-and-flashing.md)).
