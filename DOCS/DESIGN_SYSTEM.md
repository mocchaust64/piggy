# 🎨 Design System & Visual Standards - Vàng Heo Đất

This document defines the branding, typography, and interaction standards for the Vàng Heo Đất application, ensuring a "Super App" experience.

---

## 💎 Brand Identity

### Color Palette

We use a premium, high-contrast palette targeting trust and warmth.

- **Piggy Red (`#D4001A`)**: Primary action color, used for buttons and critical headers.
- **Gold Accent (`#FFD700`)**: Used for balance values and success states.
- **Pearl White (`#F9FAFB`)**: Main background color for a clean, professional look.
- **Glass Overlay**: Semi-transparent white (`rgba(255, 255, 255, 0.8)`) with `LinearGradient` to simulate depth.

### Typography

- **Primary Font**: **Outfit** (Sans-Serif).
- **Scale**:
  - **H1 (Large)**: 28pt, Bold (Screen titles).
  - **H2 (Medium)**: 20pt, SemiBold (Card titles).
  - **Body**: 16pt, Regular (General text).
  - **Caption**: 12pt, Medium (Subtitles).

---

## ⚡ Premium Interaction Standards

To achieve a "Super App" feel, all components must follow these interaction rules:

### 1. Spring-Based Scaling

All primary `Pressable` components (Buttons, Cards) MUST use Reanimated `withSpring` on press.

- **Scale-down**: `0.95x` on `onPressIn`.
- **Scale-back**: `1.0x` on `onPressOut`.
- **Spring Config**: `stiffness: 300, damping: 20`.

### 2. Tactile Haptics

Interactions must provide physical feedback using `expo-haptics`.

- **Primary Actions**: `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)`.
- **Success/Finish**: `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`.

### 3. Glassmorphism Simulation

Since `expo-blur` requires native builds, we use the **"Linear Mock"** technique:

- `LinearGradient` from transparent to semi-opaque white.
- Subtle inner borders (`1.5px`) with a lighter shade of the background.

---

## 📐 Grid System

- **Base Grid**: 8pt.
- **Gaps**: Always use multiples of 8 (`8, 16, 24, 32`).
- **Paddings**: Standard horizontal padding is **20pt** for iPhone-optimized layouts.
