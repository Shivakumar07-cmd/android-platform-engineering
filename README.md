# Android Platform Engineering

A practical engineering knowledge base covering Android Open Source Project (AOSP), Android Framework internals, system architecture, Linux kernel, Hardware Abstraction Layer (HAL), and embedded Android device development.

**Website:** https://shivakumar07-cmd.github.io/android-platform-engineering/

## About

This project aims to document Android platform engineering concepts through detailed technical explanations, source-code analysis, architecture diagrams, debugging techniques, and practical experiments.

The documentation focuses on understanding how Android works internally rather than providing interview-oriented question-and-answer material.

## Documentation Areas

| Area | Coverage |
|---|---|
| Android Fundamentals | Architecture, boot process, build system |
| Android Frameworks | Framework architecture and system services |
| Activity Manager | Activity lifecycle, process management, AMS |
| Window Manager | Window lifecycle, WMS, display management |
| Binder IPC | Binder architecture, AIDL, IPC transactions |
| System Server | Service initialization and boot phases |
| Package Manager | Package installation and management |
| HAL | Hardware abstraction and service integration |
| Linux Kernel | Kernel architecture, drivers and Device Tree |
| Device Bring-up | Board configuration and hardware integration |
| Debugging | Logcat, dumpsys, tracing and troubleshooting |

## Hardware Platforms

Practical development and debugging documentation will include:

- Radxa Rock 5B Plus
- Rockchip RK3588 platform
- Android 12 AOSP

## Running Locally

Requirements:
- Node.js 20 or later
- npm

Install dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run start
```

Build the production website:

```bash
npm run build
```

Test the production build locally:

```bash
npm run serve
```

## Deployment

The website is hosted using GitHub Pages.

GitHub Actions automatically builds and deploys the website whenever changes are pushed to the `main` branch.

## Repository

https://github.com/Shivakumar07-cmd/android-platform-engineering

## License

Documentation and source-code licensing will be specified as the project evolves.
