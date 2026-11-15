---
title: Build issues and fixes
sidebar_position: 4
description: Problems hit while building Android 12 for the ROCK 5B+, with the cause and fix for each.
---

# Build issues and fixes

Paths use `~/Rock5BPlus` as the source root.

| # | Issue | Cause | Fix |
|---|---|---|---|
| 1 | U-Boot fails to build | It expects a `kern.dtb` file | Link it from the kernel DTS |
| 2 | `libncurses5` missing | Not packaged on newer Ubuntu | Install the old `.deb` files |
| 3 | U-Boot needs Python 2 | Old scripts in U-Boot | Build Python 2.7 from source |
| 4 | Clang error building the kernel | Compiler setup | Prebuilt Clang, then LLVM flags, then GCC |
| 5 | Wrong kernel config | Several defconfigs exist | Use `rk3588-rock-5b-gen2_defconfig` |
| 6 | Build fails on `m4` after moving the tree | Stale absolute path in Soong output | Delete the stale symlink |
| 7 | Build stops at about 73%, `insertkeys.py` missing | Missing host tool | Resolved while continuing the build |

## 1. U-Boot fails to build

```bash
cd ~/Rock5BPlus/u-boot/dts
ln -sf ../../kernel-5.10/arch/arm64/boot/dts/rockchip/rk3588-rock-5b-gen2.dts kern.dtb
```

Copying instead of linking also works:

```bash
cp ../../kernel-5.10/arch/arm64/boot/dts/rockchip/rk3588-rock-5b-gen2.dts kern.dtb
```

This points at the DTS source file and was enough for this build to go through.

## 2. libncurses5 is missing

```bash
wget http://security.ubuntu.com/ubuntu/pool/universe/n/ncurses/libtinfo5_6.2-0ubuntu2.1_amd64.deb
wget http://security.ubuntu.com/ubuntu/pool/universe/n/ncurses/libncurses5_6.2-0ubuntu2.1_amd64.deb
sudo dpkg -i libtinfo5_6.2-0ubuntu2.1_amd64.deb libncurses5_6.2-0ubuntu2.1_amd64.deb
```

These URLs can change over time, so look the packages up if a download fails.

## 3. U-Boot needs Python 2

```bash
sudo apt install wget build-essential libssl-dev zlib1g-dev \
  libncurses5-dev libbz2-dev libreadline-dev libsqlite3-dev

cd /tmp
wget https://www.python.org/ftp/python/2.7.18/Python-2.7.18.tgz
tar -xvf Python-2.7.18.tgz
cd Python-2.7.18
./configure --enable-optimizations
make -j$(nproc)
sudo make altinstall

sudo ln -s /usr/local/bin/python2.7 /usr/bin/python2
sudo apt install python-is-python3
```

## 4. Clang error when building the kernel

Try these in order.

**a) Put the prebuilt Clang on the PATH:**

```bash
export PATH=~/Rock5BPlus/prebuilts/clang/host/linux-x86/clang-r416183b/bin:$PATH
export CLANG_PATH=~/Rock5BPlus/prebuilts/clang/host/linux-x86/clang-r416183b/bin
```

**b) If that fails, build with LLVM and relaxed flags:**

```bash
make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- \
  LLVM=1 LLVM_IAS=1 KCFLAGS="-Wno-error -mno-hard-float" -j8
```

**c) If that fails, clean and build with GCC:**

```bash
cd ~/Rock5BPlus
rm -rf kernel-5.10/.config kernel-5.10/out
cd kernel-5.10
make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- rk3588-rock-5b-gen2_defconfig
make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- -j$(nproc)
```

The GCC build was the one I ended up using.

## 5. Wrong kernel configuration

The Rockchip tree has several defconfigs. For this board the right one is:

```text
rk3588-rock-5b-gen2_defconfig
```

```bash
make ARCH=arm64 rk3588-rock-5b-gen2_defconfig
make ARCH=arm64 menuconfig      # to inspect or change options
grep -E 'CONFIG_PCI=|CONFIG_BLK_DEV_NVME=' .config
```

## 6. Build fails on `m4` after moving the source tree

I first synced into `~/radxa_gitea`, then moved the tree to `~/Rock5BPlus`. Soong's generated files still pointed at the old path. The tool itself was fine:

```bash
ls -l prebuilts/build-tools/linux-x86/bin/m4
```

The fix was to delete the stale generated symlink and rebuild:

```bash
rm out/soong/.intermediates/prebuilts/build-tools/m4/linux_glibc_x86_64/m4
```

Soong regenerates it with the current path.

**Lesson:** moving an Android source tree can leave stale absolute paths in `out/`. Delete `out/` or the affected intermediates after moving it.

## 7. Build stops at about 73%: `insertkeys.py` missing

The build reached about 73% and then failed because `out/host/linux-x86/bin/insertkeys.py` was missing. That is a host-tool problem, not a kernel or framework one. I fixed it while continuing the build, but I did not write down exactly what resolved it.

If you hit the same failure, these commands help find where the script should come from:

```bash
find . -name insertkeys.py
ls -la out/host/linux-x86/bin/
grep -R "insertkeys.py" build/ device/ vendor/ 2>/dev/null
```

## What these issues taught me

1. **Match the defconfig to the board, not just the SoC.**
2. **A moved source tree can break generated paths.** Clean the affected output.
3. **Host tools are part of the build.** The Android code can be fine while a helper script fails.
4. **The percentage does not tell you which layer failed.** Read the log, which is why I used `tee`.
5. **A successful kernel build is not hardware validation.** Always test on the device.
