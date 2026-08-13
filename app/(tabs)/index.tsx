import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";

const SAVE_KEY = "kishan-ki-takkar-save-v1";
const MENU_AUDIO = require("../../assets/audio/menu-loop.mp3");
const GAMEOVER_AUDIO = require("../../assets/audio/gameover-loop.mp3");
const LANE_X = [-1, 0, 1];
const GOLD = "#FFD93D";
const NAVY = "#1A237E";
const PINK = "#FF6B6B";
const GREEN = "#00E676";
const ORANGE = "#FF5722";
const BLUE = "#1DA1F2";

type Page = "home" | "game" | "skins" | "leaderboard" | "settings";
type ObstacleType = "road" | "mud" | "rival" | "money";
type CollectibleType = "follower" | "tick";
type Action = "run" | "jump" | "slide";

type Skin = {
  id: number;
  name: string;
  outfit: string;
  power: string;
  unlock: string;
  followerGoal?: number;
  pointCost?: number;
  color: string;
  icon: string;
};

type RunObject = {
  id: number;
  lane: number;
  depth: number;
  kind: ObstacleType | CollectibleType;
};

type SaveData = {
  points: number;
  highestFollowers: number;
  highestPoints: number;
  unlocked: number[];
  equipped: number;
  soundOn: boolean;
  sensitivity: number;
};

const SKINS: Skin[] = [
  { id: 1, name: "Kisan Leader", outfit: "White kurta • Nehru jacket • topi", power: "Standard speed and jump.", unlock: "Default", color: "#F7F2E8", icon: "♟" },
  { id: 2, name: "Sherwani King", outfit: "Golden sherwani • red safa", power: "Follower attraction counts each follower twice.", unlock: "50 followers in one run", followerGoal: 50, color: "#DDAA27", icon: "♛" },
  { id: 3, name: "Lohia Look", outfit: "Khadi kurta • Gandhi cap • round glasses", power: "Auto-dodges one obstacle every 10 seconds.", unlock: "100 followers in one run", followerGoal: 100, color: "#E8E4D6", icon: "◉" },
  { id: 4, name: "Bhojpuri Star", outfit: "Silk kurta • gold chain • aviators", power: "Permanent 20% speed burst.", unlock: "200 followers in one run", followerGoal: 200, color: "#DA69A0", icon: "★" },
  { id: 5, name: "Wedding Wala", outfit: "Pink pagdi • sehra • cream sherwani", power: "Survive one obstacle hit per run.", unlock: "500 followers in one run", followerGoal: 500, color: "#F29AB6", icon: "♥" },
  { id: 6, name: "Super Ravi", outfit: "Orange dhoti • angavastra • crown", power: "Fly over obstacles for 5 seconds every 50 followers.", unlock: "1,000 followers in one run", followerGoal: 1000, color: "#FF8F24", icon: "☀" },
  { id: 7, name: "Police Wala", outfit: "Khaki uniform • cap • belt", power: "Siren slows enemies for 5 seconds.", unlock: "500 points", pointCost: 500, color: "#C7A86A", icon: "★" },
  { id: 8, name: "Pilot Baba", outfit: "Orange robe • beard • rudraksha", power: "Auto-jump every 100 meters.", unlock: "800 points", pointCost: 800, color: "#E47A2E", icon: "✦" },
  { id: 9, name: "Film Star", outfit: "Leather jacket • white tee • torn jeans", power: "Money bags give +5 points instead of slowing.", unlock: "1,200 points", pointCost: 1200, color: "#292A3A", icon: "✶" },
  { id: 10, name: "Maharaja", outfit: "Royal turban • angarkha • sword", power: "Breaks an obstacle every 150 meters for +20.", unlock: "2,000 points", pointCost: 2000, color: "#8D43C5", icon: "♚" },
];

const DEFAULT_SAVE: SaveData = {
  points: 0,
  highestFollowers: 0,
  highestPoints: 0,
  unlocked: [1],
  equipped: 1,
  soundOn: true,
  sensitivity: 1,
};

function safeHaptic(kind: "light" | "success" | "error" = "light") {
  if (Platform.OS === "web") return;
  if (kind === "success") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  else if (kind === "error") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

function formatNumber(value: number) {
  return value.toLocaleString("en-IN");
}

export default function HomeScreen() {
  const [page, setPage] = useState<Page>("home");
  const menuPlayer = useAudioPlayer(MENU_AUDIO);
  const [save, setSave] = useState<SaveData>(DEFAULT_SAVE);
  const [loaded, setLoaded] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(SAVE_KEY).then((raw) => {
      if (raw) {
        try {
          setSave({ ...DEFAULT_SAVE, ...JSON.parse(raw) });
        } catch {
          setSave(DEFAULT_SAVE);
        }
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
  }, []);

  useEffect(() => {
    menuPlayer.loop = true;
    if (!loaded) return;
    if (save.soundOn && page !== "game") menuPlayer.play();
    else menuPlayer.pause();
  }, [loaded, menuPlayer, page, save.soundOn]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(SAVE_KEY, JSON.stringify(save));
  }, [loaded, save]);

  const updateSave = useCallback((patch: Partial<SaveData>) => {
    setSave((current) => ({ ...current, ...patch }));
  }, []);

  const startGame = useCallback(() => {
    safeHaptic("success");
    setGameKey((key) => key + 1);
    setPage("game");
  }, []);

  const goHome = useCallback(() => setPage("home"), []);

  if (!loaded) return <View style={styles.loading}><Text style={styles.loadingText}>Loading the village...</Text></View>;

  if (page === "game") {
    return (
      <GameScreen
        key={gameKey}
        save={save}
        onExit={goHome}
        onRunComplete={(followers, points) => {
          setSave((current) => ({
            ...current,
            points: current.points + points,
            highestFollowers: Math.max(current.highestFollowers, followers),
            highestPoints: Math.max(current.highestPoints, points),
            unlocked: SKINS.filter((skin) => skin.followerGoal && followers >= skin.followerGoal || skin.pointCost && current.points + points >= skin.pointCost || skin.id === 1).map((skin) => skin.id),
          }));
        }}
      />
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} containerClassName="bg-background">
      <StatusBar style="light" />
      {page === "home" && <MainMenu save={save} onPlay={startGame} onNavigate={setPage} />}
      {page === "skins" && <SkinsScreen save={save} onBack={goHome} onSave={updateSave} />}
      {page === "leaderboard" && <LeaderboardScreen save={save} onBack={goHome} />}
      {page === "settings" && <SettingsScreen save={save} onBack={goHome} onSave={updateSave} />}
    </ScreenContainer>
  );
}

function HoliBackdrop({ children, dim = false }: { children: ReactNode; dim?: boolean }) {
  return (
    <View style={[styles.holiBackdrop, dim && styles.dimBackdrop]}>
      <View style={[styles.colorBlob, styles.blobPink]} />
      <View style={[styles.colorBlob, styles.blobYellow]} />
      <View style={[styles.colorBlob, styles.blobGreen]} />
      <View style={styles.sunGlow} />
      <View style={styles.confettiLayer} pointerEvents="none">
        {Array.from({ length: 24 }).map((_, index) => (
          <View key={index} style={[styles.confetti, { left: `${(index * 37) % 100}%`, top: `${(index * 53) % 80}%`, backgroundColor: [PINK, GOLD, "#62D96B", "#FF9933"][index % 4], transform: [{ rotate: `${index * 19}deg` }] }]} />
        ))}
      </View>
      {children}
    </View>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.brandMark, compact && styles.brandMarkCompact]}>
      <View style={styles.brandIcon}><Text style={styles.brandIconText}>क</Text></View>
      <View>
        <Text style={[styles.brandKicker, compact && styles.brandKickerCompact]}>RUN • COLLECT • WIN</Text>
        <Text style={[styles.brandTitle, compact && styles.brandTitleCompact]}>KISHAN KI</Text>
        <Text style={[styles.brandTitle, compact && styles.brandTitleCompact, styles.brandTitleAccent]}>TAKKAR</Text>
      </View>
    </View>
  );
}

function MainMenu({ save, onPlay, onNavigate }: { save: SaveData; onPlay: () => void; onNavigate: (page: Page) => void }) {
  return (
    <HoliBackdrop>
      <View style={styles.menuContent}>
        <BrandMark />
        <View style={styles.heroCharacter}>
          <View style={styles.heroShadow} />
          <View style={styles.heroHead}><Text style={styles.heroMustache}>⌁</Text></View>
          <View style={styles.heroTopi}><Text style={styles.heroTopiDot}>●</Text></View>
          <View style={styles.heroBody}><Text style={styles.heroNamaste}>🙏</Text></View>
          <View style={styles.heroFeet}><View style={styles.foot} /><View style={styles.foot} /></View>
          <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>KISHAN</Text></View>
        </View>
        <View style={styles.menuTagline}><Text style={styles.taglineText}>The village run starts now.</Text><Text style={styles.taglineSub}>Dodge drama. Gather the people.</Text></View>
        <View style={styles.menuStats}>
          <StatPill icon="♟" label="BEST FOLLOWERS" value={formatNumber(save.highestFollowers)} />
          <StatPill icon="₹" label="POINTS" value={formatNumber(save.points)} />
        </View>
        <View style={styles.menuButtons}>
          <GameButton title="PLAY" subtitle="Start a fresh run" color={GREEN} icon="▶" onPress={onPlay} large />
          <View style={styles.buttonRow}>
            <GameButton title="SKINS" subtitle="Dress Kishan" color="#2586DB" icon="✦" onPress={() => { safeHaptic(); onNavigate("skins"); }} />
            <GameButton title="SCORES" subtitle="Local leaderboard" color="#7650D9" icon="♛" onPress={() => { safeHaptic(); onNavigate("leaderboard"); }} />
          </View>
          <Pressable onPress={() => { safeHaptic(); onNavigate("settings"); }} style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}><Text style={styles.settingsIcon}>⚙</Text><Text style={styles.settingsText}>SETTINGS</Text></Pressable>
        </View>
        <Text style={styles.menuFoot}>A bright, chaotic village runner • portrait mode</Text>
      </View>
    </HoliBackdrop>
  );
}

function StatPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <View style={styles.statPill}><Text style={styles.statIcon}>{icon}</Text><View><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text></View></View>;
}

function GameButton({ title, subtitle, color, icon, onPress, large = false }: { title: string; subtitle: string; color: string; icon: string; onPress: () => void; large?: boolean }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.gameButton, { backgroundColor: color, borderColor: "rgba(255,255,255,0.55)" }, large && styles.gameButtonLarge, pressed && styles.pressed]}><View style={styles.buttonIcon}><Text style={styles.buttonIconText}>{icon}</Text></View><View style={styles.buttonCopy}><Text style={styles.gameButtonTitle}>{title}</Text><Text style={styles.gameButtonSubtitle}>{subtitle}</Text></View><Text style={styles.buttonChevron}>›</Text></Pressable>;
}

function GameScreen({ save, onExit, onRunComplete }: { save: SaveData; onExit: () => void; onRunComplete: (followers: number, points: number) => void }) {
  const { width, height } = useWindowDimensions();
  const [followers, setFollowers] = useState(0);
  const [points, setPoints] = useState(0);
  const [meters, setMeters] = useState(0);
  const [power, setPower] = useState(0);
  const [magnet, setMagnet] = useState(0);
  const [boost, setBoost] = useState(0);
  const [toast, setToast] = useState("");
  const [objects, setObjects] = useState<RunObject[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [lane, setLane] = useState(1);
  const [action, setAction] = useState<Action>("run");
  const speed = 1;
  const [isPaused, setPaused] = useState(false);
  const gameOverPlayer = useAudioPlayer(GAMEOVER_AUDIO);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const trailOpacity = useRef(new Animated.Value(0)).current;
  const objectsRef = useRef<RunObject[]>([]);
  const runtime = useRef({ lane: 1, action: "run" as Action, elapsed: 0, spawn: 0, followers: 0, points: 0, power: 0, magnet: 0, boost: 0, meters: 0, gameOver: false });

  const showToast = useCallback((message: string) => {
    setToast(message);
    toastOpacity.setValue(0);
    Animated.sequence([Animated.timing(toastOpacity, { toValue: 1, duration: 120, useNativeDriver: true }), Animated.delay(650), Animated.timing(toastOpacity, { toValue: 0, duration: 250, useNativeDriver: true })]).start();
  }, [toastOpacity]);

  const doAction = useCallback((next: Action | "left" | "right") => {
    if (runtime.current.gameOver || isPaused) return;
    safeHaptic();
    if (next === "left") runtime.current.lane = Math.max(0, runtime.current.lane - 1);
    else if (next === "right") runtime.current.lane = Math.min(2, runtime.current.lane + 1);
    else runtime.current.action = next;
    setLane(runtime.current.lane);
    setAction(runtime.current.action);
    trailOpacity.setValue(1);
    Animated.timing(trailOpacity, { toValue: 0, duration: 280, useNativeDriver: true }).start();
    if (next === "jump" || next === "slide") setTimeout(() => { if (!runtime.current.gameOver) { runtime.current.action = "run"; setAction("run"); } }, 520);
  }, [isPaused, trailOpacity]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderRelease: (_, gesture) => {
      const sensitivity = Math.max(0.65, save.sensitivity);
      if (Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 28 / sensitivity) doAction(gesture.dx > 0 ? "right" : "left");
      else if (gesture.dy < -28 / sensitivity) doAction("jump");
      else if (gesture.dy > 28 / sensitivity) doAction("slide");
    },
  }), [doAction, save.sensitivity]);

  useEffect(() => {
    gameOverPlayer.loop = true;
    if (gameOver && save.soundOn) gameOverPlayer.play();
    else gameOverPlayer.pause();
  }, [gameOver, gameOverPlayer, save.soundOn]);

  useEffect(() => {
    const timer = setInterval(() => {
      const r = runtime.current;
      if (r.gameOver || isPaused) return;
      r.elapsed += 0.05;
      r.meters += 0.8 * (1 + (r.boost > 0 ? 0.3 : 0)) * (save.equipped === 4 ? 1.2 : 1);
      r.spawn -= 0.05;
      r.magnet = Math.max(0, r.magnet - 0.05);
      r.boost = Math.max(0, r.boost - 0.05);
      if (r.spawn <= 0) {
        const laneIndex = Math.floor(Math.random() * 3);
        const roll = Math.random();
        const kind: ObstacleType | CollectibleType = roll < 0.52 ? "follower" : roll < 0.6 && Math.floor(r.meters) % 20 === 0 ? "tick" : (["road", "mud", "rival", "money"][Math.floor(Math.random() * 4)] as ObstacleType);
        const newObject = { id: Date.now() + Math.random(), lane: laneIndex, depth: 0, kind };
        r.spawn = Math.max(0.48, 0.92 - Math.min(0.32, r.meters / 1300));
        objectsRef.current = [...objectsRef.current, newObject];
      }
      const nextObjects: RunObject[] = [];
      let collectedFollowers = 0;
      let collectedPoints = 0;
      let nextPower = r.power;
      for (const object of objectsRef.current) {
        const nextDepth = object.depth + 0.028 * speed * (r.boost > 0 ? 1.3 : 1);
        const sameLane = object.lane === r.lane;
        const nearPlayer = nextDepth > 0.78;
        if (object.kind === "follower" && ((sameLane && nearPlayer) || (r.magnet > 0 && nextDepth > 0.56))) {
          collectedFollowers += save.equipped === 2 ? 2 : 1;
          collectedPoints += r.boost > 0 ? 20 : 10;
          nextPower = Math.min(100, nextPower + (save.equipped === 2 ? 5 : 10));
          continue;
        }
        if (object.kind === "tick" && sameLane && nearPlayer) {
          r.magnet = 15;
          nextPower = Math.min(100, nextPower + 5);
          collectedPoints += 50;
          showToast("✓ MAGNET ACTIVATED");
          safeHaptic("success");
          continue;
        }
        if (object.kind !== "follower" && object.kind !== "tick" && sameLane && nearPlayer) {
          const protectedByBoost = r.boost > 0;
          const protectedByShield = save.equipped === 5 && !r.gameOver;
          const canAvoid = (object.kind === "road" && r.action === "jump") || (object.kind === "mud" && r.action === "slide") || object.kind === "rival" && !sameLane;
          if (object.kind === "money") {
            if (save.equipped === 9) { collectedPoints += 5; continue; }
            r.spawn += 0.8;
            showToast("Daam trap! Speed dipped");
            continue;
          }
          if (!protectedByBoost && !protectedByShield && !canAvoid) {
            r.gameOver = true;
            safeHaptic("error");
            setGameOver(true);
            onRunComplete(r.followers + collectedFollowers, r.points + collectedPoints);
            continue;
          }
          if (protectedByShield) { showToast("SHIELD SAVED YOU"); continue; }
          continue;
        }
        if (nextDepth < 1.08) nextObjects.push({ ...object, depth: nextDepth });
      }
      r.followers += collectedFollowers;
      r.points += collectedPoints;
      r.power = nextPower;
      if (r.power >= 100 && r.boost <= 0) {
        r.boost = 10;
        r.power = 0;
        showToast("⚡ BOOST ACTIVATED");
        safeHaptic("success");
      }
      objectsRef.current = nextObjects;
      setObjects(nextObjects);
      setFollowers(r.followers);
      setPoints(r.points);
      setPower(r.power);
      setMagnet(r.magnet);
      setBoost(r.boost);
      setMeters(Math.floor(r.meters));
      if (collectedFollowers > 0) showToast(`+${collectedPoints}  FOLLOWERS JOINED`);
    }, 50);
    return () => clearInterval(timer);
  }, [isPaused, onRunComplete, save.equipped, showToast, speed]);

  const restart = () => {
    runtime.current = { lane: 1, action: "run", elapsed: 0, spawn: 0, followers: 0, points: 0, power: 0, magnet: 0, boost: 0, meters: 0, gameOver: false };
    objectsRef.current = [];
    setObjects([]); setFollowers(0); setPoints(0); setMeters(0); setPower(0); setMagnet(0); setBoost(0); setLane(1); setAction("run"); setGameOver(false); setPaused(false);
  };

  return (
    <View style={styles.gameRoot} {...panResponder.panHandlers}>
      <StatusBar hidden />
      <View style={styles.gameSky}><View style={styles.gameSun} /><View style={styles.gameCloudOne} /><View style={styles.gameCloudTwo} /></View>
      <View style={styles.villageRow}>
        {Array.from({ length: 8 }).map((_, index) => <View key={index} style={[styles.house, { left: index * (width / 6) - 18, backgroundColor: ["#F49E5A", "#D87664", "#F1C75B", "#D995D7"][index % 4] }]}><View style={styles.houseRoof} /><View style={styles.houseDoor} /></View>)}
      </View>
      <View style={styles.temple}><Text style={styles.templeFlag}>⚑</Text><Text style={styles.templeText}>ॐ</Text></View>
      <View style={styles.roadPerspective}><View style={styles.roadCenter} /><View style={[styles.roadLaneLine, { left: "33%" }]} /><View style={[styles.roadLaneLine, { left: "66%" }]} /><View style={styles.roadPowderPink} /><View style={styles.roadPowderYellow} /></View>
      <View style={styles.gameHud} pointerEvents="box-none">
        <View style={styles.hudTopRow}>
          <Pressable onPress={() => setPaused((value) => !value)} style={styles.pauseButton}><Text style={styles.pauseText}>{isPaused ? "▶" : "Ⅱ"}</Text></Pressable>
          <View style={styles.hudMetric}><Text style={styles.hudMetricLabel}>FOLLOWERS</Text><Text style={styles.hudMetricValue}>{formatNumber(followers)}</Text></View>
          <View style={styles.hudMetric}><Text style={styles.hudMetricLabel}>POINTS</Text><Text style={[styles.hudMetricValue, { color: GREEN }]}>₹ {formatNumber(points)}</Text></View>
          <View style={styles.meterWrap}><Text style={styles.meterBolt}>⚡</Text><View style={styles.meterTrack}><View style={[styles.meterFill, { height: `${power}%` }]} /></View><Text style={styles.meterLabel}>{Math.round(power)}%</Text></View>
        </View>
        <View style={styles.distancePill}><Text style={styles.distanceText}>{meters} m</Text><Text style={styles.distanceSub}>VILLAGE SPRINT</Text></View>
        {boost > 0 && <View style={styles.modeBanner}><Text style={styles.modeBannerText}>⚡ BOOST {Math.ceil(boost)}s</Text></View>}
        {magnet > 0 && <View style={[styles.modeBanner, styles.magnetBanner]}><Text style={styles.modeBannerText}>✦ MAGNET {Math.ceil(magnet)}s</Text></View>}
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}><Text style={styles.toastText}>{toast}</Text></Animated.View>
      </View>
      <View style={styles.objectsLayer} pointerEvents="none">
        {objects.map((object) => <RunnerObject key={object.id} object={object} width={width} height={height} />)}
      </View>
      <Animated.View pointerEvents="none" style={[styles.swipeTrail, { opacity: trailOpacity, left: width / 2 - 2, top: height * 0.42, transform: [{ rotate: action === "jump" ? "-14deg" : action === "slide" ? "14deg" : "90deg" }] }]} />
      <PlayerAvatar lane={lane} action={action} equipped={save.equipped} width={width} height={height} />
      <View style={styles.controlHint}><Text style={styles.controlHintText}>SWIPE TO DODGE • UP TO JUMP • DOWN TO SLIDE</Text></View>
      {isPaused && !gameOver && <View style={styles.pauseOverlay}><Text style={styles.pauseTitle}>RUN PAUSED</Text><Text style={styles.pauseSub}>Take a breath, neta ji.</Text><Pressable onPress={() => setPaused(false)} style={styles.resumeButton}><Text style={styles.resumeText}>RESUME</Text></Pressable><Pressable onPress={onExit} style={styles.quitLink}><Text style={styles.quitText}>QUIT RUN</Text></Pressable></View>}
      {gameOver && <GameOverOverlay followers={followers} points={points} onRestart={restart} onHome={onExit} />}
    </View>
  );
}

function RunnerObject({ object, width, height }: { object: RunObject; width: number; height: number }) {
  const depth = Math.min(1, object.depth);
  const laneX = width / 2 + LANE_X[object.lane] * (width * (0.16 + depth * 0.06));
  const top = height * 0.28 + depth * height * 0.48;
  const scale = 0.46 + depth * 0.8;
  const isCollectible = object.kind === "follower" || object.kind === "tick";
  const color = object.kind === "tick" ? BLUE : object.kind === "follower" ? "#FFF2A8" : object.kind === "money" ? GOLD : object.kind === "mud" ? "#795548" : object.kind === "rival" ? "#E94E64" : "#B45D42";
  return <View style={[styles.runnerObject, { left: laneX - 28 * scale, top, transform: [{ scale }], zIndex: Math.round(depth * 50) }]}><View style={[styles.objectGlow, { backgroundColor: color, opacity: isCollectible ? 0.22 : 0.1 }]} /><Text style={[styles.objectEmoji, { color }]}>{object.kind === "follower" ? "♟♟♟" : object.kind === "tick" ? "✓" : object.kind === "road" ? "▰" : object.kind === "mud" ? "≈" : object.kind === "rival" ? "☻" : "₹"}</Text><Text style={styles.objectLabel}>{object.kind === "follower" ? "+10" : object.kind === "tick" ? "MAGNET" : object.kind.toUpperCase()}</Text></View>;
}

function PlayerAvatar({ lane, action, equipped, width, height }: { lane: number; action: Action; equipped: number; width: number; height: number }) {
  const skin = SKINS.find((item) => item.id === equipped) ?? SKINS[0];
  const laneX = width / 2 + LANE_X[lane] * (width * 0.22);
  return <View style={[styles.playerAvatar, { left: laneX - 44, top: action === "jump" ? height * 0.58 : action === "slide" ? height * 0.68 : height * 0.63 }]}><View style={[styles.playerAura, { backgroundColor: skin.color }]} /><View style={[styles.playerTopi, { backgroundColor: skin.color }]} /><View style={styles.playerFace}><Text style={styles.playerEyes}>•  •</Text><Text style={styles.playerMoustache}>⌁</Text></View><View style={[styles.playerKurta, { backgroundColor: skin.color }]}><Text style={styles.playerHands}>{action === "jump" ? "↟" : action === "slide" ? "⌁" : "🙏"}</Text></View><View style={styles.playerLegs}><View style={styles.playerShoe} /><View style={styles.playerShoe} /></View><Text style={styles.playerName}>{skin.name}</Text></View>;
}

function GameOverOverlay({ followers, points, onRestart, onHome }: { followers: number; points: number; onRestart: () => void; onHome: () => void }) {
  return <View style={styles.gameOverOverlay}><View style={styles.gameOverScene}><Text style={styles.treeTop}>✣</Text><View style={styles.treeTrunk} /><View style={styles.hangingKishan}><Text style={styles.hangingFace}>☹</Text><Text style={styles.hangingBody}>🙏</Text></View><View style={styles.dancingEnemies}><Text>♟   ♟   ♟</Text><Text style={styles.danceMarks}>↯  ♪  ↯  ♪  ↯</Text></View></View><View style={styles.gameOverCard}><Text style={styles.gameOverTitle}>GAME OVER</Text><Text style={styles.gameOverSub}>The village saw everything.</Text><View style={styles.gameOverStats}><View><Text style={styles.gameOverStatLabel}>FOLLOWERS</Text><Text style={styles.gameOverStatValue}>{formatNumber(followers)}</Text></View><View><Text style={styles.gameOverStatLabel}>POINTS EARNED</Text><Text style={[styles.gameOverStatValue, { color: GREEN }]}>₹ {formatNumber(points)}</Text></View></View><View style={styles.gameOverButtons}><Pressable onPress={() => { safeHaptic("success"); onRestart(); }} style={({ pressed }) => [styles.restartButton, pressed && styles.pressed]}><Text style={styles.restartText}>↻  RESTART</Text></Pressable><Pressable onPress={onHome} style={({ pressed }) => [styles.homeButton, pressed && styles.pressed]}><Text style={styles.homeButtonText}>⌂  HOME</Text></Pressable></View></View></View>;
}

function ScreenHeader({ title, kicker, onBack }: { title: string; kicker: string; onBack: () => void }) {
  return <View style={styles.screenHeader}><Pressable onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}><Text style={styles.backText}>‹</Text></Pressable><View><Text style={styles.headerKicker}>{kicker}</Text><Text style={styles.headerTitle}>{title}</Text></View><View style={styles.headerAccent}><Text style={styles.headerAccentText}>क</Text></View></View>;
}

function SkinsScreen({ save, onBack, onSave }: { save: SaveData; onBack: () => void; onSave: (patch: Partial<SaveData>) => void }) {
  const [selected, setSelected] = useState(save.equipped);
  const selectedSkin = SKINS.find((skin) => skin.id === selected) ?? SKINS[0];
  const isUnlocked = save.unlocked.includes(selected);
  const canBuy = selectedSkin.pointCost !== undefined && save.points >= selectedSkin.pointCost;
  const equip = () => {
    if (!isUnlocked && canBuy) { onSave({ points: save.points - (selectedSkin.pointCost ?? 0), unlocked: [...save.unlocked, selected] }); safeHaptic("success"); }
    else if (isUnlocked) { onSave({ equipped: selected }); safeHaptic("success"); }
  };
  return <HoliBackdrop dim><ScrollView contentContainerStyle={styles.innerScroll} showsVerticalScrollIndicator={false}><ScreenHeader title="SKIN GARAGE" kicker="CHANGE YOUR LOOK" onBack={onBack} /><View style={styles.pointsBanner}><Text style={styles.pointsBannerIcon}>₹</Text><View><Text style={styles.pointsBannerLabel}>WALLET</Text><Text style={styles.pointsBannerValue}>{formatNumber(save.points)} points</Text></View><Text style={styles.pointsBannerHint}>Earn points by gathering followers</Text></View><View style={styles.skinPreviewCard}><View style={[styles.skinHalo, { backgroundColor: selectedSkin.color }]}><Text style={styles.skinPreviewIcon}>{selectedSkin.icon}</Text></View><Text style={styles.skinPreviewName}>{selectedSkin.name}</Text><Text style={styles.skinPreviewOutfit}>{selectedSkin.outfit}</Text><View style={styles.powerChip}><Text style={styles.powerChipLabel}>PASSIVE POWER</Text><Text style={styles.powerChipText}>{selectedSkin.power}</Text></View>{isUnlocked ? <Pressable onPress={equip} style={({ pressed }) => [styles.equipButton, save.equipped === selected && styles.equippedButton, pressed && styles.pressed]}><Text style={styles.equipText}>{save.equipped === selected ? "EQUIPPED ✓" : "EQUIP SKIN"}</Text></Pressable> : <Pressable onPress={equip} disabled={!canBuy} style={({ pressed }) => [styles.buyButton, !canBuy && styles.disabledButton, pressed && canBuy && styles.pressed]}><Text style={styles.equipText}>{canBuy ? `BUY FOR ₹${selectedSkin.pointCost}` : `LOCKED • ${selectedSkin.unlock}`}</Text></Pressable>}</View><Text style={styles.sectionCaption}>ALL 10 LOOKS</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.skinRail}>{SKINS.map((skin) => { const unlocked = save.unlocked.includes(skin.id); return <Pressable key={skin.id} onPress={() => { safeHaptic(); setSelected(skin.id); }} style={({ pressed }) => [styles.skinTile, selected === skin.id && styles.skinTileActive, pressed && styles.pressed]}><View style={[styles.skinTileIcon, { backgroundColor: skin.color }]}><Text style={styles.skinTileIconText}>{unlocked ? skin.icon : "🔒"}</Text></View><Text style={styles.skinTileName}>{skin.name}</Text><Text style={styles.skinTileStatus}>{unlocked ? "UNLOCKED" : skin.unlock}</Text></Pressable>; })}</ScrollView></ScrollView></HoliBackdrop>;
}

function LeaderboardScreen({ save, onBack }: { save: SaveData; onBack: () => void }) {
  return <HoliBackdrop dim><ScrollView contentContainerStyle={styles.innerScroll}><ScreenHeader title="SCOREBOARD" kicker="YOUR LOCAL LEGACY" onBack={onBack} /><View style={styles.trophyCard}><Text style={styles.trophyEmoji}>♛</Text><Text style={styles.trophyTitle}>THE VILLAGE RECORD</Text><Text style={styles.trophySub}>No cloud. No noise. Just your best run.</Text><View style={styles.recordRow}><View style={styles.recordBox}><Text style={styles.recordLabel}>BEST FOLLOWERS</Text><Text style={styles.recordValue}>{formatNumber(save.highestFollowers)}</Text><Text style={styles.recordCaption}>people in your corner</Text></View><View style={styles.recordBox}><Text style={styles.recordLabel}>BEST POINTS</Text><Text style={[styles.recordValue, { color: GREEN }]}>₹ {formatNumber(save.highestPoints)}</Text><Text style={styles.recordCaption}>earned in one run</Text></View></View></View><View style={styles.leaderboardList}><Text style={styles.sectionCaption}>RUNNER BOARD</Text><LeaderboardRow rank="01" title="Kishan" score={save.highestFollowers} color={GOLD} /><LeaderboardRow rank="02" title="Future you" score={Math.max(0, save.highestFollowers - 12)} color="#C9D2E4" /><LeaderboardRow rank="03" title="The chaiwala" score={Math.max(0, save.highestFollowers - 29)} color="#C17A4C" /></View></ScrollView></HoliBackdrop>;
}

function LeaderboardRow({ rank, title, score, color }: { rank: string; title: string; score: number; color: string }) {
  return <View style={styles.leaderboardRow}><Text style={[styles.rankText, { color }]}>{rank}</Text><View style={styles.rankAvatar}><Text>♟</Text></View><Text style={styles.runnerName}>{title}</Text><Text style={styles.runnerScore}>{formatNumber(score)} <Text style={styles.runnerScoreLabel}>followers</Text></Text></View>;
}

function SettingRow({ icon, title, subtitle, control }: { icon: string; title: string; subtitle: string; control: ReactNode }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIconBox}><Text style={styles.settingIcon}>{icon}</Text></View>
      <View style={styles.settingTextBlock}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      {control}
    </View>
  );
}

function SettingsScreen({ save, onBack, onSave }: { save: SaveData; onBack: () => void; onSave: (patch: Partial<SaveData>) => void }) {
  return <HoliBackdrop dim><ScrollView contentContainerStyle={styles.innerScroll}><ScreenHeader title="SETTINGS" kicker="MAKE IT YOUR RUN" onBack={onBack} /><View style={styles.settingsCard}><SettingRow icon="♫" title="Sound & music" subtitle={save.soundOn ? "Dhol beats are on" : "Silent run"} control={<Pressable onPress={() => { safeHaptic(); onSave({ soundOn: !save.soundOn }); }} style={[styles.toggle, save.soundOn && styles.toggleOn]}><View style={[styles.toggleKnob, save.soundOn && styles.toggleKnobOn]} /></Pressable>} /><View style={styles.settingDivider} /><View style={styles.sensitivityBlock}><View style={styles.settingIconBox}><Text style={styles.settingIcon}>↔</Text></View><View style={styles.settingTextBlock}><Text style={styles.settingTitle}>Swipe sensitivity</Text><Text style={styles.settingSubtitle}>How quickly Kishan changes lanes</Text><View style={styles.sensitivityRail}>{[0.75, 1, 1.25].map((value) => <Pressable key={value} onPress={() => { safeHaptic(); onSave({ sensitivity: value }); }} style={[styles.sensitivityDot, save.sensitivity === value && styles.sensitivityDotActive]}><Text style={styles.sensitivityText}>{value === 0.75 ? "LOW" : value === 1 ? "MID" : "HIGH"}</Text></Pressable>)}</View></View></View></View><View style={styles.helpCard}><Text style={styles.helpTitle}>HOW TO PLAY</Text><Text style={styles.helpText}>Swipe left or right to switch lanes. Swipe up to leap broken roads. Swipe down to slide across mud. Gather followers, grab the blue tick magnet, and fill the lightning meter.</Text></View><Text style={styles.versionText}>KISHAN KI TAKKAR  •  v1.0.0</Text></ScrollView></HoliBackdrop>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: NAVY, alignItems: "center", justifyContent: "center" },
  loadingText: { color: "white", fontSize: 18, fontWeight: "800" },
  holiBackdrop: { flex: 1, backgroundColor: "#F88477", overflow: "hidden", position: "relative" },
  dimBackdrop: { backgroundColor: "#B95A72" },
  colorBlob: { position: "absolute", borderRadius: 999, opacity: 0.78 },
  blobPink: { width: 260, height: 260, top: -80, left: -80, backgroundColor: PINK },
  blobYellow: { width: 320, height: 320, bottom: -145, right: -110, backgroundColor: GOLD },
  blobGreen: { width: 180, height: 180, top: 220, right: -72, backgroundColor: "#63D46C" },
  sunGlow: { position: "absolute", top: 50, right: 35, width: 72, height: 72, borderRadius: 50, backgroundColor: "#FFF7B7", opacity: 0.55 },
  confettiLayer: { ...StyleSheet.absoluteFillObject },
  confetti: { position: "absolute", width: 7, height: 17, borderRadius: 3, opacity: 0.65 },
  menuContent: { flex: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: 22, paddingBottom: 10 },
  brandMark: { alignSelf: "stretch", flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  brandMarkCompact: { marginBottom: 0 },
  brandIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: NAVY, borderWidth: 2, borderColor: GOLD, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-8deg" }] },
  brandIconText: { color: GOLD, fontSize: 27, fontWeight: "900" },
  brandKicker: { color: "rgba(255,255,255,0.84)", fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  brandKickerCompact: { fontSize: 8 },
  brandTitle: { color: "#FFF4B0", fontSize: 23, lineHeight: 23, fontWeight: "900", letterSpacing: 1.1, textShadowColor: "rgba(26,35,126,0.6)", textShadowOffset: { width: 1, height: 2 }, textShadowRadius: 0 },
  brandTitleCompact: { fontSize: 18, lineHeight: 18 },
  brandTitleAccent: { color: "white" },
  heroCharacter: { width: 156, height: 170, alignItems: "center", justifyContent: "flex-end", marginTop: 12, marginBottom: 10 },
  heroShadow: { position: "absolute", bottom: 3, width: 130, height: 19, borderRadius: 80, backgroundColor: "rgba(26,35,126,0.22)" },
  heroHead: { position: "absolute", top: 26, width: 57, height: 57, borderRadius: 32, backgroundColor: "#B96A44", borderWidth: 3, borderColor: "#FFF2D6", alignItems: "center", justifyContent: "flex-end", paddingBottom: 5 },
  heroMustache: { color: NAVY, fontSize: 26, fontWeight: "900", transform: [{ rotate: "-4deg" }] },
  heroTopi: { position: "absolute", top: 10, width: 72, height: 25, borderRadius: 15, backgroundColor: "#F8F8F0", borderBottomWidth: 4, borderBottomColor: NAVY, alignItems: "center", justifyContent: "center" },
  heroTopiDot: { color: "#FE7C6A", fontSize: 9 },
  heroBody: { width: 88, height: 95, borderRadius: 28, backgroundColor: "#F9F2DF", borderWidth: 4, borderColor: "#FF9933", alignItems: "center", justifyContent: "center" },
  heroNamaste: { fontSize: 36 },
  heroFeet: { flexDirection: "row", gap: 22, marginBottom: 2 },
  foot: { width: 34, height: 12, borderRadius: 10, backgroundColor: "#362C45" },
  heroBadge: { position: "absolute", bottom: 33, right: 4, borderRadius: 9, backgroundColor: NAVY, paddingHorizontal: 7, paddingVertical: 3, transform: [{ rotate: "8deg" }] },
  heroBadgeText: { fontSize: 8, fontWeight: "900", color: GOLD, letterSpacing: 1 },
  menuTagline: { alignItems: "center", marginBottom: 12 },
  taglineText: { color: "white", fontSize: 18, fontWeight: "900", letterSpacing: 0.3 },
  taglineSub: { color: "rgba(26,35,126,0.74)", fontSize: 12, fontWeight: "800", marginTop: 3 },
  menuStats: { flexDirection: "row", gap: 10, marginBottom: 12 },
  statPill: { minWidth: 135, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 15, backgroundColor: "rgba(26,35,126,0.84)", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)" },
  statIcon: { fontSize: 21, color: GOLD },
  statLabel: { color: "rgba(255,255,255,0.65)", fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  statValue: { color: "white", fontSize: 15, fontWeight: "900", marginTop: 1 },
  menuButtons: { alignSelf: "stretch", gap: 9 },
  gameButton: { minHeight: 56, borderRadius: 18, borderWidth: 2, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", shadowColor: "#1A237E", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  gameButtonLarge: { minHeight: 66 },
  buttonRow: { flexDirection: "row", gap: 9 },
  buttonRowButton: { flex: 1 },
  buttonIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.24)", alignItems: "center", justifyContent: "center" },
  buttonIconText: { color: "white", fontSize: 19, fontWeight: "900" },
  buttonCopy: { flex: 1, marginLeft: 10 },
  gameButtonTitle: { color: "white", fontSize: 17, fontWeight: "900", letterSpacing: 1 },
  gameButtonSubtitle: { color: "rgba(255,255,255,0.78)", fontSize: 10, fontWeight: "700", marginTop: 1 },
  buttonChevron: { color: "white", fontSize: 30, fontWeight: "300", marginRight: 4 },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.84 },
  settingsButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 5 },
  settingsIcon: { color: NAVY, fontSize: 16 },
  settingsText: { color: NAVY, fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
  menuFoot: { marginTop: "auto", color: "rgba(26,35,126,0.62)", fontSize: 10, fontWeight: "800" },
  innerScroll: { padding: 22, paddingBottom: 40 },
  screenHeader: { flexDirection: "row", alignItems: "center", marginBottom: 22 },
  backButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: "rgba(26,35,126,0.86)", alignItems: "center", justifyContent: "center", marginRight: 13 },
  backText: { color: "white", fontSize: 35, fontWeight: "300", marginTop: -5 },
  headerKicker: { color: "rgba(255,255,255,0.75)", fontSize: 9, fontWeight: "900", letterSpacing: 1.4 },
  headerTitle: { color: "white", fontSize: 26, fontWeight: "900", letterSpacing: 0.5, textShadowColor: "rgba(26,35,126,0.5)", textShadowOffset: { width: 1, height: 2 }, textShadowRadius: 0 },
  headerAccent: { marginLeft: "auto", width: 42, height: 42, borderRadius: 13, backgroundColor: GOLD, alignItems: "center", justifyContent: "center", transform: [{ rotate: "7deg" }] },
  headerAccentText: { color: NAVY, fontSize: 26, fontWeight: "900" },
  pointsBanner: { flexDirection: "row", alignItems: "center", borderRadius: 18, padding: 13, backgroundColor: NAVY, borderWidth: 1, borderColor: "rgba(255,255,255,0.22)", marginBottom: 16 },
  pointsBannerIcon: { color: GOLD, fontSize: 30, fontWeight: "900", marginRight: 11 },
  pointsBannerLabel: { color: "rgba(255,255,255,0.62)", fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  pointsBannerValue: { color: "white", fontSize: 17, fontWeight: "900", marginTop: 2 },
  pointsBannerHint: { marginLeft: "auto", maxWidth: 115, textAlign: "right", color: "rgba(255,255,255,0.62)", fontSize: 10, fontWeight: "700", lineHeight: 14 },
  skinPreviewCard: { backgroundColor: "rgba(255,255,255,0.88)", borderRadius: 26, alignItems: "center", padding: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.8)", shadowColor: NAVY, shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 4 },
  skinHalo: { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center", borderWidth: 7, borderColor: "rgba(26,35,126,0.1)", marginBottom: 9 },
  skinPreviewIcon: { color: NAVY, fontSize: 58, fontWeight: "900" },
  skinPreviewName: { color: NAVY, fontSize: 22, fontWeight: "900" },
  skinPreviewOutfit: { color: "#516078", fontSize: 11, fontWeight: "700", marginTop: 4, textAlign: "center" },
  powerChip: { alignSelf: "stretch", marginTop: 14, padding: 11, borderRadius: 14, backgroundColor: "#FFF5C4" },
  powerChipLabel: { color: "#AA7900", fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  powerChipText: { color: NAVY, fontSize: 12, fontWeight: "800", marginTop: 3, lineHeight: 17 },
  equipButton: { alignSelf: "stretch", alignItems: "center", justifyContent: "center", paddingVertical: 13, borderRadius: 14, marginTop: 14, backgroundColor: GREEN },
  equippedButton: { backgroundColor: NAVY },
  buyButton: { alignSelf: "stretch", alignItems: "center", justifyContent: "center", paddingVertical: 13, borderRadius: 14, marginTop: 14, backgroundColor: "#FF9933" },
  disabledButton: { backgroundColor: "#A4AABC" },
  equipText: { color: "white", fontSize: 13, fontWeight: "900", letterSpacing: 1 },
  sectionCaption: { color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginTop: 20, marginBottom: 9 },
  skinRail: { gap: 10, paddingBottom: 5 },
  skinTile: { width: 112, backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 17, padding: 9, borderWidth: 2, borderColor: "transparent" },
  skinTileActive: { borderColor: GOLD, backgroundColor: "white" },
  skinTileIcon: { height: 74, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  skinTileIconText: { color: NAVY, fontSize: 38, fontWeight: "900" },
  skinTileName: { color: NAVY, fontSize: 11, fontWeight: "900", marginTop: 8 },
  skinTileStatus: { color: "#657084", fontSize: 8, fontWeight: "800", marginTop: 3, lineHeight: 11 },
  trophyCard: { borderRadius: 25, padding: 22, backgroundColor: NAVY, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },
  trophyEmoji: { fontSize: 48, color: GOLD, marginBottom: 6 },
  trophyTitle: { color: GOLD, fontSize: 18, fontWeight: "900", letterSpacing: 1.1 },
  trophySub: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "700", marginTop: 5, textAlign: "center" },
  recordRow: { flexDirection: "row", gap: 9, width: "100%", marginTop: 20 },
  recordBox: { flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 15, padding: 12 },
  recordLabel: { color: "rgba(255,255,255,0.62)", fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  recordValue: { color: GOLD, fontSize: 25, fontWeight: "900", marginTop: 4 },
  recordCaption: { color: "rgba(255,255,255,0.58)", fontSize: 9, fontWeight: "700", marginTop: 2 },
  leaderboardList: { marginTop: 8 },
  leaderboardRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.82)", marginBottom: 9 },
  rankText: { width: 28, fontSize: 16, fontWeight: "900" },
  rankAvatar: { width: 35, height: 35, borderRadius: 12, backgroundColor: "#FFF1B4", alignItems: "center", justifyContent: "center", marginRight: 10 },
  runnerName: { color: NAVY, fontSize: 14, fontWeight: "900", flex: 1 },
  runnerScore: { color: NAVY, fontSize: 14, fontWeight: "900" },
  runnerScoreLabel: { color: "#74809A", fontSize: 9, fontWeight: "700" },
  settingsCard: { borderRadius: 22, padding: 15, backgroundColor: "rgba(255,255,255,0.88)" },
  settingRow: { flexDirection: "row", alignItems: "center" },
  settingIconBox: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#FFF0A8", alignItems: "center", justifyContent: "center", marginRight: 11 },
  settingIcon: { color: NAVY, fontSize: 20, fontWeight: "900" },
  settingTextBlock: { flex: 1 },
  settingTitle: { color: NAVY, fontSize: 14, fontWeight: "900" },
  settingSubtitle: { color: "#64748B", fontSize: 10, fontWeight: "700", marginTop: 3 },
  settingDivider: { height: 1, backgroundColor: "#E7E3DB", marginVertical: 15 },
  toggle: { width: 50, height: 30, borderRadius: 18, padding: 3, backgroundColor: "#BBC3D2", justifyContent: "center" },
  toggleOn: { backgroundColor: GREEN },
  toggleKnob: { width: 24, height: 24, borderRadius: 14, backgroundColor: "white" },
  toggleKnobOn: { alignSelf: "flex-end" },
  sensitivityBlock: { flexDirection: "row", alignItems: "flex-start" },
  sensitivityRail: { flexDirection: "row", gap: 7, marginTop: 12 },
  sensitivityDot: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, backgroundColor: "#EDEFF3" },
  sensitivityDotActive: { backgroundColor: NAVY },
  sensitivityText: { color: "#738097", fontSize: 8, fontWeight: "900" },
  helpCard: { marginTop: 16, borderRadius: 20, padding: 18, backgroundColor: "#FFF2B1" },
  helpTitle: { color: "#9A6C00", fontSize: 11, fontWeight: "900", letterSpacing: 1.1 },
  helpText: { color: NAVY, fontSize: 12, fontWeight: "700", lineHeight: 18, marginTop: 7 },
  versionText: { textAlign: "center", color: "rgba(255,255,255,0.65)", fontSize: 10, fontWeight: "800", marginTop: 24 },
  gameRoot: { flex: 1, backgroundColor: "#8BD7EF", overflow: "hidden" },
  gameSky: { ...StyleSheet.absoluteFillObject, backgroundColor: "#86D9F0" },
  gameSun: { position: "absolute", top: 44, right: 24, width: 64, height: 64, borderRadius: 36, backgroundColor: "#FFF4AB" },
  gameCloudOne: { position: "absolute", top: 72, left: 20, width: 86, height: 18, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.7)" },
  gameCloudTwo: { position: "absolute", top: 130, right: 80, width: 62, height: 14, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.58)" },
  villageRow: { position: "absolute", top: "22%", left: 0, right: 0, height: "27%", overflow: "hidden" },
  house: { position: "absolute", bottom: 0, width: 76, height: 120, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderWidth: 2, borderColor: "rgba(83,48,49,0.18)" },
  houseRoof: { position: "absolute", top: -11, left: -7, right: -7, height: 24, borderRadius: 8, backgroundColor: "#9B4D5A", transform: [{ skewX: "-18deg" }] },
  houseDoor: { position: "absolute", bottom: 0, left: 29, width: 20, height: 45, borderTopLeftRadius: 9, borderTopRightRadius: 9, backgroundColor: "#6F3A3A" },
  temple: { position: "absolute", top: "25%", left: 14, width: 42, height: 68, alignItems: "center", justifyContent: "flex-end" },
  templeFlag: { position: "absolute", top: -15, color: "#F04F5F", fontSize: 25 },
  templeText: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#FDE49C", color: "#C77935", textAlign: "center", textAlignVertical: "center", fontSize: 22, fontWeight: "900" },
  roadPerspective: { position: "absolute", bottom: -30, left: "-42%", width: "184%", height: "68%", backgroundColor: "#C98262", transform: [{ perspective: 500 }, { rotateX: "1deg" }], overflow: "hidden" },
  roadCenter: { position: "absolute", top: 0, bottom: 0, left: "49.6%", width: 4, backgroundColor: "rgba(255,225,129,0.3)" },
  roadLaneLine: { position: "absolute", top: 0, bottom: 0, width: 3, backgroundColor: "rgba(255,242,188,0.54)", borderRadius: 4 },
  roadPowderPink: { position: "absolute", width: 130, height: 52, borderRadius: 80, backgroundColor: "#F45B78", opacity: 0.34, bottom: 30, left: 30, transform: [{ rotate: "-15deg" }] },
  roadPowderYellow: { position: "absolute", width: 110, height: 44, borderRadius: 80, backgroundColor: GOLD, opacity: 0.37, bottom: 100, right: 50, transform: [{ rotate: "16deg" }] },
  gameHud: { ...StyleSheet.absoluteFillObject, zIndex: 20 },
  hudTopRow: { paddingTop: 18, paddingHorizontal: 14, flexDirection: "row", alignItems: "flex-start", gap: 8 },
  pauseButton: { width: 37, height: 37, borderRadius: 13, backgroundColor: "rgba(26,35,126,0.82)", alignItems: "center", justifyContent: "center" },
  pauseText: { color: "white", fontWeight: "900", fontSize: 16 },
  hudMetric: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 11, backgroundColor: "rgba(26,35,126,0.75)", minWidth: 82 },
  hudMetricLabel: { color: "rgba(255,255,255,0.62)", fontSize: 7, fontWeight: "900", letterSpacing: 0.8 },
  hudMetricValue: { color: GOLD, fontSize: 15, fontWeight: "900", marginTop: 1 },
  meterWrap: { marginLeft: "auto", alignItems: "center", width: 31 },
  meterBolt: { color: GOLD, fontSize: 17, position: "absolute", top: -3, zIndex: 2 },
  meterTrack: { marginTop: 17, height: 93, width: 13, borderRadius: 9, backgroundColor: "rgba(26,35,126,0.58)", borderWidth: 2, borderColor: "rgba(255,255,255,0.5)", overflow: "hidden", justifyContent: "flex-end" },
  meterFill: { width: "100%", backgroundColor: ORANGE, borderRadius: 7 },
  meterLabel: { color: "white", fontSize: 7, fontWeight: "900", marginTop: 3 },
  distancePill: { position: "absolute", top: 116, left: 14, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.55)", paddingHorizontal: 9, paddingVertical: 5 },
  distanceText: { color: NAVY, fontSize: 14, fontWeight: "900" },
  distanceSub: { color: "#53627B", fontSize: 7, fontWeight: "900", letterSpacing: 0.8 },
  modeBanner: { position: "absolute", top: 174, alignSelf: "center", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: "#C48714", borderWidth: 2, borderColor: GOLD },
  magnetBanner: { backgroundColor: "#1564B4", borderColor: "#A7E6FF" },
  modeBannerText: { color: "white", fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },
  toast: { position: "absolute", top: 215, alignSelf: "center", paddingHorizontal: 13, paddingVertical: 8, backgroundColor: NAVY, borderRadius: 15, borderWidth: 2, borderColor: GOLD },
  toastText: { color: "white", fontSize: 11, fontWeight: "900" },
  objectsLayer: { ...StyleSheet.absoluteFillObject, zIndex: 12 },
  runnerObject: { position: "absolute", width: 56, height: 65, alignItems: "center", justifyContent: "center" },
  objectGlow: { position: "absolute", width: 56, height: 56, borderRadius: 30 },
  objectEmoji: { fontSize: 30, fontWeight: "900", textShadowColor: "rgba(26,35,126,0.25)", textShadowOffset: { width: 1, height: 2 }, textShadowRadius: 2 },
  objectLabel: { color: "white", fontSize: 7, fontWeight: "900", backgroundColor: "rgba(26,35,126,0.75)", paddingHorizontal: 4, borderRadius: 4, marginTop: 2 },
  playerAvatar: { position: "absolute", width: 88, height: 125, zIndex: 18, alignItems: "center" },
  playerAura: { position: "absolute", bottom: 6, width: 83, height: 24, borderRadius: 50, opacity: 0.35 },
  playerTopi: { position: "absolute", top: 1, width: 44, height: 16, borderRadius: 12, borderBottomWidth: 3, borderBottomColor: NAVY },
  playerFace: { position: "absolute", top: 11, width: 38, height: 38, borderRadius: 22, backgroundColor: "#B96A44", borderWidth: 2, borderColor: "#FFE6BA", alignItems: "center", justifyContent: "flex-end", paddingBottom: 3 },
  playerEyes: { color: NAVY, fontSize: 7, fontWeight: "900", position: "absolute", top: 11 },
  playerMoustache: { color: NAVY, fontSize: 16, fontWeight: "900" },
  playerKurta: { position: "absolute", top: 45, width: 58, height: 62, borderRadius: 18, borderWidth: 3, borderColor: "#FF9933", alignItems: "center", justifyContent: "center" },
  playerHands: { fontSize: 22 },
  playerLegs: { position: "absolute", bottom: 4, flexDirection: "row", gap: 14 },
  playerShoe: { width: 22, height: 10, borderRadius: 10, backgroundColor: "#312941" },
  playerName: { position: "absolute", bottom: -12, color: "white", fontSize: 8, fontWeight: "900", backgroundColor: NAVY, borderRadius: 5, paddingHorizontal: 5 },
  swipeTrail: { position: "absolute", width: 5, height: 100, borderRadius: 5, backgroundColor: "#B4F4FF", zIndex: 25 },
  controlHint: { position: "absolute", bottom: 24, alignSelf: "center", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, backgroundColor: "rgba(26,35,126,0.66)", zIndex: 22 },
  controlHintText: { color: "rgba(255,255,255,0.84)", fontSize: 8, fontWeight: "900", letterSpacing: 0.4 },
  pauseOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 30, backgroundColor: "rgba(26,35,126,0.78)", alignItems: "center", justifyContent: "center" },
  pauseTitle: { color: GOLD, fontSize: 28, fontWeight: "900" },
  pauseSub: { color: "white", fontSize: 13, fontWeight: "700", marginTop: 6 },
  resumeButton: { marginTop: 22, backgroundColor: GREEN, borderRadius: 16, paddingHorizontal: 28, paddingVertical: 14 },
  resumeText: { color: NAVY, fontSize: 14, fontWeight: "900", letterSpacing: 1 },
  quitLink: { marginTop: 15 },
  quitText: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  gameOverOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 40, backgroundColor: "rgba(16,20,45,0.78)", alignItems: "center", justifyContent: "center", padding: 20 },
  gameOverScene: { width: "100%", height: 170, backgroundColor: "#52765D", borderRadius: 24, overflow: "hidden", alignItems: "center", justifyContent: "flex-end", marginBottom: -16 },
  treeTop: { position: "absolute", top: 4, left: 24, color: "#2F573A", fontSize: 102 },
  treeTrunk: { position: "absolute", left: "18%", top: 10, width: 27, height: 180, backgroundColor: "#704632", borderRadius: 16, transform: [{ rotate: "-11deg" }] },
  hangingKishan: { position: "absolute", left: "40%", top: 25, transform: [{ rotate: "180deg" }], alignItems: "center" },
  hangingFace: { fontSize: 37, color: "#B96A44", backgroundColor: "#F5E6CF", borderRadius: 30, padding: 5 },
  hangingBody: { fontSize: 44, marginTop: -5 },
  dancingEnemies: { width: "70%", alignItems: "center", paddingBottom: 15 },
  danceMarks: { color: GOLD, fontSize: 21, fontWeight: "900", marginTop: -3 },
  gameOverCard: { width: "100%", borderRadius: 23, padding: 20, paddingTop: 28, backgroundColor: "#FFF8E5", alignItems: "center" },
  gameOverTitle: { color: NAVY, fontSize: 29, fontWeight: "900", letterSpacing: 1 },
  gameOverSub: { color: "#69758B", fontSize: 11, fontWeight: "700", marginTop: 3 },
  gameOverStats: { flexDirection: "row", gap: 14, marginTop: 17, marginBottom: 18 },
  gameOverStatLabel: { color: "#7C8494", fontSize: 8, fontWeight: "900", letterSpacing: 0.9, textAlign: "center" },
  gameOverStatValue: { color: NAVY, fontSize: 22, fontWeight: "900", textAlign: "center", marginTop: 3 },
  gameOverButtons: { width: "100%", gap: 8 },
  restartButton: { backgroundColor: GREEN, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  restartText: { color: NAVY, fontSize: 14, fontWeight: "900", letterSpacing: 0.8 },
  homeButton: { backgroundColor: GOLD, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  homeButtonText: { color: NAVY, fontSize: 14, fontWeight: "900", letterSpacing: 0.8 },
});

