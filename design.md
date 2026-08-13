# Kishan Ki Takkar - Mobile App Interface Design

## Overview
**Kishan Ki Takkar** is a satirical, action-packed 3D endless runner set in a colorful Indian village (Banaras-inspired) featuring Kishan as the hero, dodging obstacles (Broken road, Mud puddle, Akhilesh Yadav, Money bag traps), collecting followers, Blue Ticks (magnets), and chasing enemies (Rahul, Javed, Kajal).

## Screen List
1. **Main Menu Screen (`app/(tabs)/index.tsx` or `app/index.tsx`)**:
   - Festive Holi color splash background (pink, yellow, green).
   - 3D-styled title "KISHAN KI TAKKAR" in gold block letters with sparkling animation.
   - Kishan character display in Namaste pose.
   - Buttons: **PLAY**, **SKINS**, **LEADERBOARD**, **SETTINGS**.
2. **Game Play Screen (`app/game.tsx`)**:
   - Canvas/WebGL or high-performance 2.5D/3D perspective canvas runner view.
   - 3 lanes with smooth swipe navigation (Left, Right, Jump, Slide).
   - HUD: Score, Followers count, Power Meter (fiery orange with lightning bolt), pause button, coin/points balance.
   - Magnet Mode & Boost Mode visual effects and banner alerts.
3. **Skins & Shop Screen (`app/skins.tsx`)**:
   - Horizontal scrollable carousel of 10 unlockable skins (Kisan Leader, Sherwani King, Lohia Look, Bhojpuri Star, Wedding Wala, Super Ravi, Police Wala, Pilot Baba, Film Star, Maharaja).
   - Display unlock criteria, passive powers, and EQUIP / BUY buttons.
4. **Leaderboard & Stats Screen (`app/leaderboard.tsx`)**:
   - Local high scores, highest followers achieved, stats overview.
5. **Settings Modal/Screen (`app/settings.tsx`)**:
   - Sound toggle (BGM & SFX), swipe sensitivity slider.
6. **Game Over Modal (`app/gameover.tsx`)**:
   - Hanging upside down from a tree animation/graphic.
   - Chasing enemies dancing below in Bhojpuri style.
   - Stats summary: Followers collected, Points earned.
   - Buttons: **RESTART**, **HOME**.

## Key User Flows
- **Start Game**: Tapping PLAY → Loads Game Screen → Automatic forward run in 3 lanes → Swipe/Tap controls → Collect followers & avoid obstacles → Game Over on hit → Game Over screen with stats & restart/home.
- **Unlock Skins**: Main Menu → SKINS → View unlocked/locked skins → Equip or buy with earned points → Return to menu.
- **Leaderboard/Settings**: Main Menu → LEADERBOARD / SETTINGS → View/Update preferences.
