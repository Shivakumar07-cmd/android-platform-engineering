---
title: Waveshare HDMI display and touchscreen
sidebar_position: 6
description: Fixing a blank HDMI image and wrong touch positions on a Waveshare 7-inch display with the ROCK 5B+ running Android 12.
---

# Waveshare HDMI display and touchscreen

I connected a Waveshare 7-inch HDMI touchscreen to the ROCK 5B+ running my Android 12 build. Two things went wrong, one after the other. This page explains what I saw, how I found the cause, and what fixed each problem.

## In short

| | Problem 1: Display | Problem 2: Touch |
|---|---|---|
| What I saw | No usable image | Touches landed in the wrong place |
| Where the cause was | Linux kernel, display clock setup | Android, which screen the touch belongs to |
| Cause | Two clock settings missing in the board's Device Tree | Touchscreen not tied to a specific display |
| Fix | Add two lines to one `.dts` file | Add one small `.idc` file |
| Code changed in drivers or framework | None | None |

## The setup

| Item | Value |
|---|---|
| Board | Radxa ROCK 5B+ (RK3588), Android 12, kernel 5.10 |
| Display | Waveshare 7-inch HDMI LCD (C), 1024 x 600 |
| Touch controller | WaveShare WS170120, USB ID `0eef:0005` |

The screen is connected with **two cables that do two different jobs**:

```text
HDMI cable  ->  carries the picture
USB cable   ->  carries the touches
```

Android sees them as two separate devices. That is why there were two separate problems.

---

# Problem 1: The display

## What I saw

The display worked on my laptop. On the board it gave no usable image.

## Step 1: Is the board detecting the display?

```bash
adb shell ls /sys/class/drm/
adb shell cat /sys/class/drm/card0-HDMI-A-1/status
adb shell cat /sys/class/drm/card0-HDMI-A-1/modes
```

- The HDMI connector showed `connected`.
- The list of modes included `1024x600`.

The display tells the board what it supports through a small data block called EDID. The board had read it correctly, so cable, connector and detection were fine. **The failure was after detection.**

## Step 2: Why was the mode refused?

The kernel checks every display mode before using it. For HDMI, that check is in `rockchip_drm_vop2.c`, in the function `vop2_crtc_mode_valid()`. It accepts only an **exact** match for the pixel clock:

```c
if (vcstate->output_type == DRM_MODE_CONNECTOR_HDMIA ||
    vcstate->output_type == DRM_MODE_CONNECTOR_DisplayPort)
    if (clock != request_clock)
        return MODE_CLOCK_RANGE;
```

The pixel clock is how fast pixels are sent to the screen. The numbers I saw:

| | Value |
|---|---|
| Clock the display needs | 49,000,000 Hz (49 MHz) |
| Clock the board could produce | about 48,387,000 Hz |
| Difference | about 1.25 % |

The board was a little off, the check wants an exact match, so the mode was refused.

## A shortcut that did not work

To test this idea, I temporarily let the check accept a clock up to 2 % off. An image appeared, but it was **shaky and blurry**.

That taught me two things:

1. The clock check really was the problem.
2. Accepting a wrong clock is not the same as having the right one.

I removed that change and looked for why the right clock was not available.

## The real cause

The kernel learns about a board's hardware from its **Device Tree**. Think of it as the kernel's version of `BoardConfig.mk`: a file that says what hardware the board has and how it is connected.

In the board's Device Tree, the display part (`display_subsystem`) had no link to the two HDMI PHY clocks. So the display controller could not use them to make an exact 49 MHz.

## The fix

File: `kernel-5.10/arch/arm64/boot/dts/rockchip/rk3588-rock-5b-gen2.dts`

```dts
&display_subsystem {
    clocks = <&hdptxphy_hdmi_clk0>, <&hdptxphy_hdmi_clk1>;
    clock-names = "hdmi0_phy_pll", "hdmi1_phy_pll";
};
```

- `&display_subsystem` points at the existing display node, so nothing new is created.
- `clocks` lists the two HDMI PHY clocks.
- `clock-names` gives them the names the driver looks for, in the same order.

## Proof

```bash
adb shell 'cat /sys/kernel/debug/clk/clk_summary | grep -E "dclk_vop0|clk_hdmiphy_pixel0"'
```

```text
clk_hdmiphy_pixel0    49000000
dclk_vop0             49000000
dclk_vop0_src        594000000
```

Both clocks are now exactly 49 MHz (the 594 MHz line is a source clock that feeds them). The image was clear and stable.

---

# Problem 2: The touchscreen

## What I saw

With the picture working, touching the screen did not hit the right spot.

## How a touch travels through Android

```text
USB touch chip -> Linux input device -> EventHub -> InputReader -> InputDispatcher -> your app
```

- **EventHub** finds input devices and reads their raw events.
- **InputReader** turns them into Android touches. It also decides **which display** a touchscreen belongs to.
- **InputDispatcher** hands the touch to the right window.

## Step 1: Are the raw touches correct?

First I found the touchscreen:

```bash
adb shell getevent -pl
```

It was `WaveShare WS170120` (in my case `/dev/input/event7`). It reports X from 0 to 1024 and Y from 0 to 600. The event number can change between boots.

Then I touched the four corners and the centre and watched the raw numbers:

```bash
adb shell getevent -lt /dev/input/event7
```

| Where I touched | X | Y |
|---|---:|---:|
| Top-left | 24 | 4 |
| Top-right | 1009 | 13 |
| Bottom-right | 1013 | 594 |
| Bottom-left | 20 | 599 |
| Centre | 482 | 349 |

These numbers match a 1024 x 600 screen. Nothing is swapped or flipped. **The hardware and the kernel driver were fine, so the mistake came later, inside Android.**

## Step 2: What does Android think?

```bash
adb shell dumpsys display
adb shell dumpsys input
```

`dumpsys display` listed two displays:

| Unique ID | Type | Size |
|---|---|---|
| `local:0` | Built-in | 1024 x 600 |
| `local:2` | External | 800 x 1280 |

`dumpsys input` showed that the touchscreen was **not tied to any display**:

```text
AssociatedDisplay: hasAssociatedDisplay=true, isExternal=true, displayId=''
```

With nothing set, Android chose a display on its own. It picked the external one (`local:2`), whose size does not match the touch chip's 1024 x 600 surface. The converted touch values even went negative, with Y running from -520 to 1120.

**The raw touches were right. Android was matching them to the wrong display.**

## Step 3: Android already has a setting for this

I searched the input reader source:

```bash
grep -Rn 'touch.displayId' frameworks/native/services/inputflinger/reader
```

`TouchInputMapper.cpp` reads a setting called `touch.displayId` from the device's configuration file. So I did not need to change any Android code. I only needed to supply the setting.

## The fix: an IDC file

An IDC (Input Device Configuration) file configures one input device. Android finds it by the device's USB vendor and product ID, so the name is `Vendor_0eef_Product_0005.idc`:

```ini
# Waveshare 7-inch HDMI touchscreen configuration

touch.deviceType = touchScreen
touch.orientationAware = 1
touch.displayId = local:0
```

| Line | Meaning |
|---|---|
| `touch.deviceType = touchScreen` | A touch screen, not a touchpad |
| `touch.orientationAware = 1` | Follow the display's rotation |
| `touch.displayId = local:0` | **Tie this touchscreen to display `local:0`. This line fixed it.** |

## Testing before changing the build

I tried it on the running board first:

```bash
adb root
adb remount
adb push Vendor_0eef_Product_0005.idc /vendor/usr/idc/Vendor_0eef_Product_0005.idc
adb shell chmod 644 /vendor/usr/idc/Vendor_0eef_Product_0005.idc
adb reboot
```

After the reboot:

```bash
adb shell dumpsys input
```

```text
ConfigurationFile: /vendor/usr/idc/Vendor_0eef_Product_0005.idc
AssociatedDisplay: hasAssociatedDisplay=true, isExternal=true, displayId='local:0'
```

The file was loaded and the touchscreen now had a display. Touch worked correctly.

## Making it part of every build

Pushing a file only fixes one board. To get it into every build, I put the file in the device folder and copied it into the vendor image in `RadxaRock5BGen2.mk`:

```makefile
# Waveshare 7-inch HDMI touchscreen configuration
PRODUCT_COPY_FILES += \
    device/rockchip/rk3588/RadxaRock5BGen2/idc/Vendor_0eef_Product_0005.idc:$(TARGET_COPY_OUT_VENDOR)/usr/idc/Vendor_0eef_Product_0005.idc
```

This belongs in the device folder because it is specific to this product, so other boards are not affected.

---

# What I changed in the end

| Repository | File | Change |
|---|---|---|
| `kernel-5.10` | `arch/arm64/boot/dts/rockchip/rk3588-rock-5b-gen2.dts` | Added `clocks` and `clock-names` to `display_subsystem` |
| `device/rockchip/rk3588` | `RadxaRock5BGen2/idc/Vendor_0eef_Product_0005.idc` | New file |
| `device/rockchip/rk3588` | `RadxaRock5BGen2/RadxaRock5BGen2.mk` | `PRODUCT_COPY_FILES` entry for the IDC file |

Temporary changes I made while debugging and did **not** keep:

| File | What I did |
|---|---|
| `rockchip_drm_vop2.c` | Allowed a 2 % clock difference |
| `dw-hdmi-qp.c` | Added log lines for EDID and mode count |
| `drm_probe_helper.c` | Added log lines for connector and modes |

# Quick checklist for next time

**Display is black or unstable**

```bash
adb shell cat /sys/class/drm/card0-HDMI-A-1/status
adb shell cat /sys/class/drm/card0-HDMI-A-1/modes
adb shell dmesg | grep -Ei 'drm|hdmi|vop|clock|phy|edid'
adb shell 'cat /sys/kernel/debug/clk/clk_summary | grep -E "dclk_vop|hdmiphy"'
```

Go in that order and stop at the first thing that is wrong.

**Touch lands in the wrong place**

```bash
adb shell getevent -pl
adb shell getevent -lt /dev/input/event7
adb shell dumpsys input
adb shell dumpsys display
```

If the raw numbers look right but the result is wrong, check which display the touchscreen is tied to.

# What I learned

1. **Detected does not mean configured.** The display and the touchscreen were both detected, and both were set up wrongly.
2. **Find where correct data turns wrong.** For the display it was the clock check. For touch it was the display choice.
3. **A workaround is not a fix.** The 2 % tolerance showed an image, but a blurry one.
4. **Prefer configuration over code changes.** A Device Tree entry and an IDC file did the job, with no driver or framework changes.
5. **Check at the layer you changed.** I checked kernel clock rates for the display and the loaded IDC file for touch.

*`local:0` is right for my display setup. If the display layout changes, check that it still points at the intended screen.*
