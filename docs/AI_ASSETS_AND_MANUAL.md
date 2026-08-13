# Kishan Ki Takkar: AI Assets and Player Manual

## Player Manual

**Kishan Ki Takkar** is a portrait endless runner. Kishan runs forward automatically through a vibrant Holi-colored village street. The run ends when an obstacle catches him. Your goal is to gather as many followers as possible, build points, and keep the chasing rivals behind you.

| Gesture | Action |
|---|---|
| Swipe left | Move one lane left |
| Swipe right | Move one lane right |
| Swipe up | Jump over broken road |
| Swipe down | Slide across mud |
| Tap pause | Pause or resume the run |

Followers are worth **10 points** each. Every ten followers fills the lightning meter by 10%. A Blue Tick activates a 15-second magnet that pulls nearby followers toward Kishan and awards a 50-point bonus. When the meter reaches 100%, Boost Mode runs for ten seconds: Kishan moves faster, followers are worth 20 points, and obstacles are automatically protected against.

The four obstacle silhouettes have different responses. Broken road requires a jump, mud requires a slide, the rival neta should be avoided by changing lanes, and the rupee money bag is a trap. The Film Star skin converts money bags into five points instead of a slowdown. Haptic feedback accompanies gestures, successful pickups, power activations, and game over.

## Skins

| Skin | Unlock | Passive power |
|---|---|---|
| Kisan Leader | Default | Standard speed and jump |
| Sherwani King | 50 followers in one run | Each follower counts twice |
| Lohia Look | 100 followers in one run | Auto-dodge helper |
| Bhojpuri Star | 200 followers in one run | Permanent 20% speed increase |
| Wedding Wala | 500 followers in one run | Survives one obstacle hit per run |
| Super Ravi | 1,000 followers in one run | Five-second flight burst every 50 followers |
| Police Wala | 500 points | Siren slow concept and visual skin |
| Pilot Baba | 800 points | Auto-jump concept and visual skin |
| Film Star | 1,200 points | Money bags award five points |
| Maharaja | 2,000 points | Obstacle breaker concept and visual skin |

Points, best followers, best points, unlocked skins, equipped skin, sound preference, and swipe sensitivity are saved locally with AsyncStorage.

## AI-Generated Assets

### App icon

**File:** `assets/images/icon.png` (copied to `splash-icon.png`, `favicon.png`, and `android-icon-foreground.png`)

**Prompt:** Create a square Android and iOS game launcher icon for a satirical endless runner titled Kishan Ki Takkar. Use a simple iconic low-poly cartoon Indian village runner silhouette: a confident middle-aged Indian man with a neat mustache, white kurta, saffron scarf, and blue Gandhi cap, in an energetic forward-running pose. Background is a bold Holi color burst of pink, yellow, and green. Centered composition, thick clean shapes, high contrast, warm cheerful daylight palette, no text, no letters, no border, no rounded-corner treatment, full-bleed square artwork, readable at small launcher size. Avoid realistic photography, tiny details, extra characters, flags, logos, or political symbols.

### Background music

**Files:** `assets/audio/menu-loop.mp3` and `assets/audio/gameover-loop.mp3`

**Main menu prompt:** Instrumental only, no vocals. Create a 30-second seamless-feeling loop at 112 BPM for a colorful mobile endless runner main menu. Use an upbeat North Indian folk and Bollywood-inspired rhythm built from dhol, dholak, hand claps, shehnai flourishes, bright brass stabs, and a playful plucked folk string motif. The feeling is sunny, mischievous, festive, and energetic, with a warm outdoor village atmosphere and a wide but clean stereo image. Start with a two-bar dhol pickup, establish a memorable rhythmic hook, add short call-and-response shehnai phrases, then return to the same groove and end on a beat-aligned pickup that can loop cleanly. Keep it family-friendly and original, with no recognizable existing melody, no spoken words, and no crowd chanting.

**Game-over prompt:** Instrumental only, no vocals. Create a 16-second loop at 78 BPM for a comedic mobile game over scene. Use a plaintive shehnai lead in a minor-leaning folk mode, soft dhol beat, muted tasha taps, and a few playful low brass and woodwind responses. The mood is mock-sad, theatrical, and lightly absurd rather than genuinely tragic. Keep the arrangement sparse enough for UI text, with a warm village courtyard ambience, clear rhythmic pulse, and a clean ending that can loop without a harsh click. Use entirely original melodic material, no recognizable existing tune, no spoken words, and no crowd chanting.

### In-app visual assets

The playable prototype uses lightweight vector and emoji-like silhouettes rendered in React Native so the project stays small and responsive on mid-range Android devices. The art direction is encoded in `app/(tabs)/index.tsx`: Holi blobs, colorful brick-house silhouettes, temple flags, paan/village colors, road powder splashes, low-poly-style player/obstacle symbols, a tree-based game-over scene, and distinct color-coded skin previews. These are deliberately kept as local vector-style primitives rather than large 3D textures, keeping the experience portrait-first and efficient.

## Technical Notes

The project is Expo SDK 54 with portrait orientation, React Native, Expo Router, NativeWind-compatible styling, local AsyncStorage persistence, expo-haptics, and expo-audio. The app is organized as a single routed experience for fast iteration: the tab home route coordinates menu, game, skin garage, score board, and settings views. The managed mobile app workflow should be used to build the Android APK from the project checkpoint rather than invoking a manual local APK build.

The app is ready for native-device testing through the Expo preview. The current validation pass reports zero TypeScript errors, zero ESLint errors, and the existing test suite completes with its authentication test skipped because the local flow is not configured for authenticated testing.

## Reference

The game requirements and asset prompts in this document are based on the supplied `pasted_content.txt` brief.
