/**
 * components/revision/MentorAvatar.jsx
 *
 * Animated mentor avatar – Framer Motion.
 *
 * STATE ARCHITECTURE
 * ──────────────────
 * Each AVATAR_STATE drives independent animation layers. No state shares
 * animation logic, making future additions fully isolated.
 *
 *   idle      → breathing, random blink, eye / head drift, shimmer
 *   thinking  → amber glow pulse, furrowed brows, slow ring
 *   speaking  → violet ring bursts, jaw phoneme cycles, head nods,
 *               eyebrow lifts, body lean — synced to speechDuration prop
 *   listening → emerald soft pulse, attentive raised brows, minimal motion
 *
 * EMOTION LAYER (Orthogonal to status)
 * ────────────────────────────────────
 * The avatar dynamically maps 6 emotional states to visual features:
 *   neutral     → basic default smile and standard eyebrows.
 *   happy       → wide smile, raised eyebrows, bouncy breathing.
 *   curious     → asymmetric eyebrows (one up, one down), head tilted forward.
 *   thinking    → furrowed brows (down/in), straight line mouth, slow breath.
 *   encouraging → compassionate raised brows, reassuring nod cycle.
 *   proud       → broad smile, proud lifted brows, slightly raised body stance.
 *
 * PROPS
 * ─────
 *   status        : AVATAR_STATE (required)
 *   stage         : 1 | 2 (mentor label)
 *   speechDuration: number (seconds) – syncs speaking cycles.
 *   emotion       : 'neutral' | 'happy' | 'curious' | 'thinking' | 'encouraging' | 'proud'
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useReducedMotion, AnimatePresence } from 'framer-motion';
import { Radio } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR STATE ENUM
// ─────────────────────────────────────────────────────────────────────────────
export const AVATAR_STATE = {
  IDLE:      'idle',
  THINKING:  'thinking',
  SPEAKING:  'speaking',
  LISTENING: 'listening',
};

// ─────────────────────────────────────────────────────────────────────────────
// STATE THEME MAP  (colours per state)
// ─────────────────────────────────────────────────────────────────────────────
const STATE_THEME = {
  [AVATAR_STATE.IDLE]: {
    outerGlow:   'rgba(99,102,241,0.18)',
    ringColor:   'rgba(99,102,241,0.28)',
    gradFrom:    '#4338ca',
    gradVia:     '#4f46e5',
    gradTo:      '#7c3aed',
    faceAccent:  '#818cf8',
    pupilColor:  '#c7d2fe',
    labelColor:  '#818cf8',
    glowBreath:  ['0 0 0 3px rgba(99,102,241,0.28), 0 0 42px 10px rgba(99,102,241,0.18)',
                  '0 0 0 3px rgba(99,102,241,0.28), 0 0 72px 22px rgba(99,102,241,0.22)',
                  '0 0 0 3px rgba(99,102,241,0.28), 0 0 42px 10px rgba(99,102,241,0.18)'],
    glowDuration: 3.2,
  },
  [AVATAR_STATE.THINKING]: {
    outerGlow:   'rgba(251,191,36,0.22)',
    ringColor:   'rgba(251,191,36,0.35)',
    gradFrom:    '#78350f',
    gradVia:     '#b45309',
    gradTo:     '#d97706',
    faceAccent:  '#fbbf24',
    pupilColor:  '#fde68a',
    labelColor:  '#fcd34d',
    glowBreath:  ['0 0 0 3px rgba(251,191,36,0.35), 0 0 38px 8px rgba(251,191,36,0.18)',
                  '0 0 0 3px rgba(251,191,36,0.50), 0 0 60px 18px rgba(251,191,36,0.26)',
                  '0 0 0 3px rgba(251,191,36,0.35), 0 0 38px 8px rgba(251,191,36,0.18)'],
    glowDuration: 2.4,
  },
  [AVATAR_STATE.SPEAKING]: {
    outerGlow:   'rgba(139,92,246,0.28)',
    ringColor:   'rgba(139,92,246,0.42)',
    gradFrom:    '#5b21b6',
    gradVia:     '#6d28d9',
    gradTo:      '#7c3aed',
    faceAccent:  '#a78bfa',
    pupilColor:  '#ede9fe',
    labelColor:  '#c4b5fd',
    glowBreath:  ['0 0 0 3px rgba(139,92,246,0.42), 0 0 50px 14px rgba(139,92,246,0.26)',
                  '0 0 0 3px rgba(139,92,246,0.55), 0 0 90px 28px rgba(139,92,246,0.36)',
                  '0 0 0 3px rgba(139,92,246,0.42), 0 0 50px 14px rgba(139,92,246,0.26)'],
    glowDuration: 1.6,
  },
  [AVATAR_STATE.LISTENING]: {
    outerGlow:   'rgba(52,211,153,0.22)',
    ringColor:   'rgba(52,211,153,0.35)',
    gradFrom:    '#064e3b',
    gradVia:     '#065f46',
    gradTo:      '#047857',
    faceAccent:  '#34d399',
    pupilColor:  '#a7f3d0',
    labelColor:  '#6ee7b7',
    glowBreath:  ['0 0 0 3px rgba(52,211,153,0.35), 0 0 40px 10px rgba(52,211,153,0.18)',
                  '0 0 0 3px rgba(52,211,153,0.42), 0 0 65px 20px rgba(52,211,153,0.24)',
                  '0 0 0 3px rgba(52,211,153,0.35), 0 0 40px 10px rgba(52,211,153,0.18)'],
    glowDuration: 2.8,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & TIMINGS
// ─────────────────────────────────────────────────────────────────────────────
const BLINK_BASE_MS    = 3800;
const BLINK_VAR_MS     = 1400;
const HEAD_DRIFT_MS    = 5200;
const EYE_DRIFT_MS     = 2800;
const JAW_PHONEMES     = [4, 10, 6, 13, 5, 9, 3, 12, 7, 11, 4, 8, 14, 5, 10];
const JAW_PHONEME_BEAT = 0.13;

const rand = (min, max) => Math.random() * (max - min) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ─────────────────────────────────────────────────────────────────────────────
// HOOK: useSpeakingAnimation
// ─────────────────────────────────────────────────────────────────────────────
function useSpeakingAnimation({ isSpeaking, prefersReduced, emotion }) {
  const bodyCtrl     = useAnimation();
  const headCtrl     = useAnimation();
  const eyebrowCtrl  = useAnimation();
  const jawCtrl      = useAnimation();

  useEffect(() => {
    if (prefersReduced || !isSpeaking) {
      bodyCtrl.stop();
      headCtrl.stop();
      eyebrowCtrl.stop();
      jawCtrl.stop();
      bodyCtrl.start({ y: 0, rotate: 0, scale: 1, transition: { duration: 0.4 } });
      headCtrl.start({ rotate: 0, x: 0, y: 0, transition: { duration: 0.5 } });
      eyebrowCtrl.start({ y: 0, transition: { duration: 0.3 } });
      jawCtrl.start({ scaleY: 1, transition: { duration: 0.2 } });
      return;
    }

    let cancelled = false;

    // Jaw loop (phoneme cycles)
    const runJawLoop = async () => {
      while (!cancelled) {
        // Pride/Happy speakers open mouth slightly wider, Thinking speakers narrower
        const mult = emotion === 'happy' || emotion === 'proud' ? 1.25 : emotion === 'thinking' ? 0.8 : 1.0;
        const openPx = pick(JAW_PHONEMES) * mult;
        await jawCtrl.start({
          scaleY: 1 + openPx / 60,
          transition: { duration: JAW_PHONEME_BEAT + rand(-0.03, 0.04), ease: 'easeOut' },
        });
        if (cancelled) break;
        if (Math.random() < 0.18) {
          await jawCtrl.start({ scaleY: 1, transition: { duration: 0.07, ease: 'easeIn' } });
        }
      }
    };

    // Head nods (stress & gesture rhythm)
    const runHeadLoop = async () => {
      while (!cancelled) {
        await new Promise(r => setTimeout(r, rand(350, 850)));
        if (cancelled) break;

        const nodType = Math.random();
        let nodTarget;

        if (emotion === 'curious') {
          // Curious head tilt forward
          nodTarget = { rotate: rand(-4.5, -3), x: rand(-1, 1), y: rand(1.5, 3.5) };
        } else if (emotion === 'encouraging') {
          // Encouraging gentle affirming nod
          nodTarget = { rotate: 0, x: 0, y: rand(3, 6) };
        } else if (nodType < 0.45) {
          nodTarget = { rotate: rand(-2, 2), x: rand(-3, 3), y: rand(2, 5) };
        } else if (nodType < 0.75) {
          nodTarget = { rotate: rand(-4, 4), x: rand(-3, 3), y: rand(-1, 2) };
        } else {
          nodTarget = { rotate: rand(-2, 2), x: 0, y: rand(4, 8) };
        }

        await headCtrl.start({
          ...nodTarget,
          transition: { duration: rand(0.3, 0.6), ease: [0.22, 1, 0.36, 1] },
        });
        if (cancelled) break;

        await headCtrl.start({
          rotate: nodTarget.rotate * 0.35,
          x: nodTarget.x * 0.4,
          y: nodTarget.y * 0.35,
          transition: { duration: rand(0.28, 0.5), ease: 'easeOut' },
        });
      }
    };

    // Body lean (forward/back)
    const runBodyLoop = async () => {
      while (!cancelled) {
        await new Promise(r => setTimeout(r, rand(800, 1800)));
        if (cancelled) break;

        const emphasis = Math.random() < 0.4;
        let bodyTarget = {
          y: emphasis ? rand(-7, -4) : rand(-4, -1),
          rotate: rand(-1.2, 1.2),
          scale: 1,
        };

        if (emotion === 'proud') {
          // Proud expansion chest up
          bodyTarget.scale = 1.03;
          bodyTarget.y = rand(-8, -5);
        } else if (emotion === 'curious') {
          // Lean in slightly
          bodyTarget.y = rand(2, 4);
        }

        await bodyCtrl.start({
          ...bodyTarget,
          transition: { duration: rand(0.3, 0.5), ease: [0.22, 1, 0.36, 1] },
        });
        if (cancelled) break;

        await bodyCtrl.start({
          y: emotion === 'curious' ? 2 : 0,
          rotate: rand(-0.7, 0.7),
          scale: emotion === 'proud' ? 1.02 : 1,
          transition: { duration: rand(0.35, 0.65), ease: 'easeOut' },
        });
      }
    };

    // Eyebrows matching speech stress & emotional overlay
    const runEyebrowLoop = async () => {
      while (!cancelled) {
        await new Promise(r => setTimeout(r, rand(600, 1300)));
        if (cancelled) break;

        let raise = rand(-3, -1);
        if (emotion === 'proud' || emotion === 'happy') {
          raise = rand(-4, -2.5); // Lifted highly
        } else if (emotion === 'thinking') {
          raise = rand(1.5, 3);   // Furrowed down
        }

        await eyebrowCtrl.start({
          y: raise,
          transition: { duration: 0.22, ease: 'easeOut' },
        });
        if (cancelled) break;

        await new Promise(r => setTimeout(r, rand(150, 380)));
        await eyebrowCtrl.start({
          y: 0,
          transition: { duration: 0.35, ease: 'easeIn' },
        });
      }
    };

    runJawLoop();
    runHeadLoop();
    runBodyLoop();
    runEyebrowLoop();

    return () => { cancelled = true; };
  }, [isSpeaking, prefersReduced, emotion]); // eslint-disable-line react-hooks/exhaustive-deps

  return { bodyCtrl, headCtrl, eyebrowCtrl, jawCtrl };
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: RingWave
// ─────────────────────────────────────────────────────────────────────────────
const RingWave = ({ color, delay = 0, duration = 2 }) => (
  <motion.div
    style={{
      position: 'absolute', inset: 0, borderRadius: '50%',
      border: `1.5px solid ${color}`, pointerEvents: 'none',
    }}
    animate={{ scale: [1, 1.40], opacity: [0.78, 0] }}
    transition={{ duration, delay, repeat: Infinity, ease: 'easeOut' }}
  />
);

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Eye
// ─────────────────────────────────────────────────────────────────────────────
const Eye = ({ blinking, driftX, driftY, accentColor, pupilColor, isSpeaking, emotion }) => {
  // Curious eyes open wider, Thinking squinting slightly
  const eyeHeight = emotion === 'curious' ? 22 : emotion === 'thinking' ? 18 : 21;

  return (
    <div
      style={{
        position: 'relative', display: 'flex', alignItems: 'center',
        justifyContent: 'center', width: 28, height: eyeHeight,
        background: 'rgba(12,10,28,0.88)', borderRadius: '50%',
        border: `1.5px solid ${accentColor}44`,
        boxShadow: `inset 0 1px 5px rgba(0,0,0,0.7), 0 0 10px ${accentColor}22`,
        overflow: 'hidden',
        transition: 'height 0.3s ease',
      }}
    >
      {/* Eyelid */}
      <motion.div
        style={{
          position: 'absolute', inset: 0, zIndex: 10,
          background: 'linear-gradient(180deg, #1e1b4b 0%, #0a0918 100%)',
          transformOrigin: 'top center',
        }}
        animate={{ scaleY: blinking ? 1 : 0 }}
        transition={{ duration: blinking ? 0.055 : 0.09, ease: 'easeInOut' }}
      />

      {/* Iris + pupil */}
      <motion.div
        style={{
          position: 'absolute', width: 15, height: 15, borderRadius: '50%',
          background: `radial-gradient(circle at 35% 32%, ${pupilColor}aa, ${accentColor}dd, #14102e)`,
          boxShadow: `0 0 7px ${accentColor}77`,
        }}
        animate={{
          x: driftX * (isSpeaking ? 2.5 : 3.2),
          y: driftY * (isSpeaking ? 1.8 : 2.2),
        }}
        transition={{ duration: 1.0, ease: 'easeInOut' }}
      >
        <div style={{
          position: 'absolute', width: 7, height: 7,
          top: 4, left: 4, borderRadius: '50%', background: '#05030d',
        }} />
        <div style={{
          position: 'absolute', width: 3.5, height: 3.5,
          top: 2, left: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.72)',
        }} />
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: Jaw / Mouth (Static & Speaking modes)
// ─────────────────────────────────────────────────────────────────────────────
const Jaw = ({ accentColor, jawCtrl, isSpeaking, avatarState, emotion }) => {
  // Static mouth shapes based on emotion
  if (!isSpeaking) {
    let mouthHeight = 14;
    let borderRadius = '50%';
    let borderStyle = `2px solid ${accentColor}cc`;
    let bottomOffset = 0;
    let clipStyle = 'rect(0, 32px, 14px, 0)';

    if (emotion === 'happy' || emotion === 'proud') {
      mouthHeight = 18;
      borderRadius = '0 0 16px 16px';
      borderStyle = `2px solid ${accentColor}ee`;
      bottomOffset = 2;
      clipStyle = 'auto';
    } else if (emotion === 'thinking') {
      mouthHeight = 2;
      borderRadius = '1px';
      borderStyle = `2px solid ${accentColor}99`;
      clipStyle = 'auto';
    } else if (emotion === 'curious') {
      mouthHeight = 8;
      borderRadius = '50%';
      borderStyle = `2px solid ${accentColor}bb`;
      clipStyle = 'auto';
    }

    return (
      <div style={{
        position: 'relative', width: 32, height: mouthHeight,
        marginTop: 6, overflow: 'hidden', transition: 'height 0.3s ease',
      }}>
        {emotion === 'thinking' ? (
          <div style={{ width: '100%', height: '100%', background: accentColor, opacity: 0.6 }} />
        ) : emotion === 'curious' ? (
          <div style={{
            width: 14, height: 8, borderRadius: '50%',
            border: `2px solid ${accentColor}bb`, margin: '0 auto',
          }} />
        ) : (
          <div style={{
            position: 'absolute', width: 32, height: 32, borderRadius,
            border: borderStyle,
            bottom: bottomOffset, left: 0, clip: clipStyle,
          }} />
        )}
      </div>
    );
  }

  // Speaking mouth
  return (
    <motion.div
      animate={jawCtrl}
      style={{
        position: 'relative',
        width: 34,
        height: 18,
        marginTop: 6,
        overflow: 'hidden',
        transformOrigin: 'top center',
        borderRadius: '0 0 17px 17px',
        background: `linear-gradient(180deg, ${accentColor}11 0%, rgba(10,6,30,0.9) 100%)`,
        border: `1.5px solid ${accentColor}88`,
        borderTop: 'none',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 4, right: 4, height: 1.5,
        background: `linear-gradient(90deg, transparent, ${accentColor}cc, transparent)`,
        borderRadius: 2,
      }} />

      <motion.div
        style={{
          position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
          width: 14, height: 6, borderRadius: '50%',
          background: `radial-gradient(ellipse, rgba(220,100,100,0.35) 0%, transparent 70%)`,
        }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 0.28, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 50% 0%, ${accentColor}44 0%, transparent 70%)`,
        }}
        animate={{ opacity: [0.4, 0.95, 0.4] }}
        transition={{ duration: 0.22, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN: MentorAvatar
// ─────────────────────────────────────────────────────────────────────────────
const MentorAvatar = ({
  status         = AVATAR_STATE.IDLE,
  stage          = 1,
  speechDuration = null,
  emotion        = 'neutral', // neutral, happy, curious, thinking, encouraging, proud
}) => {
  const theme          = STATE_THEME[status] ?? STATE_THEME[AVATAR_STATE.IDLE];
  const prefersReduced = useReducedMotion();
  const isSpeaking     = status === AVATAR_STATE.SPEAKING;
  const isActive       = isSpeaking || status === AVATAR_STATE.THINKING;

  // Blinking
  const [blinking, setBlinking]   = useState(false);
  const blinkTimer                = useRef(null);

  const scheduleBlink = useCallback(() => {
    const delay = BLINK_BASE_MS + rand(-BLINK_VAR_MS, BLINK_VAR_MS);
    blinkTimer.current = setTimeout(() => {
      setBlinking(true);
      setTimeout(() => { setBlinking(false); scheduleBlink(); }, 155);
    }, delay);
  }, []);

  useEffect(() => {
    if (prefersReduced) return;
    scheduleBlink();
    return () => clearTimeout(blinkTimer.current);
  }, [prefersReduced, scheduleBlink]);

  // Eye drift
  const [eyeDrift, setEyeDrift] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (prefersReduced) return;
    const ms = isSpeaking ? EYE_DRIFT_MS * 1.4 : EYE_DRIFT_MS;
    const t  = setInterval(() =>
      setEyeDrift({
        x: isSpeaking ? rand(-0.5, 0.5) : rand(-1, 1),
        y: isSpeaking ? rand(-0.25, 0.25) : rand(-0.5, 0.5),
      }), ms);
    return () => clearInterval(t);
  }, [prefersReduced, isSpeaking]);

  // Idle head drift (overridden by speaking loops)
  const [idleHeadDrift, setIdleHeadDrift] = useState({ rotate: 0, x: 0, y: 0 });
  useEffect(() => {
    if (prefersReduced || isSpeaking) return;

    // Apply permanent subtle tilt if curious, slight rise if proud
    const baseRotation = emotion === 'curious' ? -4 : 0;
    const baseOffsetY  = emotion === 'curious' ? 2 : emotion === 'proud' ? -3 : 0;

    const t = setInterval(() => setIdleHeadDrift({
      rotate: baseRotation + rand(-2.5, 2.5),
      x:      rand(-4, 4),
      y:      baseOffsetY + rand(-2, 2),
    }), HEAD_DRIFT_MS);

    return () => clearInterval(t);
  }, [prefersReduced, isSpeaking, emotion]);

  // Speaking animations (isolated hook)
  const { bodyCtrl, headCtrl, eyebrowCtrl, jawCtrl } = useSpeakingAnimation({
    isSpeaking,
    prefersReduced,
    emotion,
  });

  // Idle breathing (body)
  const breathDuration = emotion === 'thinking' ? 4.2 : emotion === 'happy' ? 2.2 : 3.4;
  const breathAmpY = emotion === 'happy' ? -4 : emotion === 'thinking' ? -1.5 : -2.5;

  const idleBreathAnim = prefersReduced ? {} : {
    y:      [0, isActive ? -5 : breathAmpY, 0],
    scaleY: [1, isActive ? 1.014 : 1.008, 1],
  };

  // Reassuring nod overlay for encouraging emotion when not speaking
  const bodyAnimTarget = isSpeaking
    ? bodyCtrl
    : (prefersReduced ? {} : (emotion === 'encouraging' ? {
        y: [0, 4, 0],
        transition: { duration: 2.0, repeat: Infinity, ease: 'easeInOut' }
      } : idleBreathAnim));

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 22, userSelect: 'none',
    }}>

      {/* Body wrapper */}
      <motion.div
        animate={bodyAnimTarget}
        transition={isSpeaking ? undefined : {
          duration: breathDuration,
          repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror',
        }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >

        {/* Glow ring */}
        <motion.div
          style={{
            position: 'relative', width: 180, height: 180,
            borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
          animate={prefersReduced ? {} : { boxShadow: theme.glowBreath }}
          transition={{ duration: theme.glowDuration, repeat: Infinity, ease: 'easeInOut' }}
        >

          {/* Ring waves */}
          <AnimatePresence>
            {isSpeaking && (
              <>
                <RingWave key="sw1" color={theme.ringColor} delay={0}   duration={1.55} />
                <RingWave key="sw2" color={theme.ringColor} delay={0.52} duration={1.55} />
                <RingWave key="sw3" color={theme.ringColor} delay={1.04} duration={1.55} />
              </>
            )}
            {status === AVATAR_STATE.LISTENING && (
              <RingWave key="lw" color={theme.ringColor} delay={0} duration={2.3} />
            )}
            {status === AVATAR_STATE.THINKING && (
              <RingWave key="tw" color={theme.ringColor} delay={0} duration={3.0} />
            )}
          </AnimatePresence>

          {/* Face circle */}
          <motion.div
            style={{
              width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
              background: `radial-gradient(circle at 35% 30%, ${theme.gradFrom}, ${theme.gradVia} 48%, ${theme.gradTo})`,
              border: '1.5px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}
            animate={prefersReduced ? {} : {
              scale: isSpeaking
                ? [1, 1.022, 1.008, 1.018, 1]
                : isActive ? [1, 1.045, 1] : [1, 1.012, 1],
            }}
            transition={{
              duration: isSpeaking ? 0.55 : isActive ? 1.5 : 3.2,
              repeat: Infinity, ease: 'easeInOut',
            }}
          >

            {/* Rotating shimmer */}
            <motion.div
              style={{
                position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none',
                background: `conic-gradient(from 0deg at 50% 50%, ${theme.gradFrom}55, ${theme.gradTo}44, ${theme.gradFrom}55)`,
              }}
              animate={prefersReduced ? {} : { rotate: [0, 360] }}
              transition={{ duration: isSpeaking ? 12 : 20, repeat: Infinity, ease: 'linear' }}
            />

            {/* Headset arc */}
            <div style={{
              position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
              width: 112, height: 56, borderRadius: '56px 56px 0 0',
              border: `2px solid ${theme.faceAccent}30`, borderBottom: 'none',
              pointerEvents: 'none',
            }} />

            {/* Head group */}
            <motion.div
              animate={isSpeaking ? headCtrl : (prefersReduced ? {} : {
                rotate: idleHeadDrift.rotate,
                x:      idleHeadDrift.x,
                y:      idleHeadDrift.y,
              })}
              transition={isSpeaking ? undefined : {
                duration: 2.8, ease: [0.25, 0.46, 0.45, 0.94],
              }}
              style={{
                position: 'relative', zIndex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 6,
              }}
            >

              {/* Eyebrows */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: -2 }}>

                {/* Left eyebrow */}
                <motion.div
                  animate={isSpeaking ? eyebrowCtrl : (prefersReduced ? {} : {
                    rotate: status === AVATAR_STATE.THINKING || emotion === 'thinking'
                      ? -9
                      : emotion === 'curious'
                      ? 5
                      : emotion === 'encouraging'
                      ? -4
                      : status === AVATAR_STATE.LISTENING ? -4 : [0, -2, 0],
                    y: emotion === 'curious' ? -3 : emotion === 'happy' || emotion === 'proud' ? -3 : 0,
                  })}
                  transition={isSpeaking ? undefined : {
                    duration: status === AVATAR_STATE.THINKING || emotion === 'thinking' ? 0.5 : 3.5,
                    repeat:   status === AVATAR_STATE.THINKING || emotion === 'thinking' ? 0   : Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{
                    width: 24, height: 2.5, borderRadius: 3,
                    background: `linear-gradient(90deg, transparent, ${theme.faceAccent}cc, transparent)`,
                    transformOrigin: 'right center',
                  }}
                />

                {/* Right eyebrow */}
                <motion.div
                  animate={isSpeaking ? eyebrowCtrl : (prefersReduced ? {} : {
                    rotate: status === AVATAR_STATE.THINKING || emotion === 'thinking'
                      ? 9
                      : emotion === 'curious'
                      ? -1
                      : emotion === 'encouraging'
                      ? 4
                      : status === AVATAR_STATE.LISTENING ? 4 : [0, 2, 0],
                    y: emotion === 'happy' || emotion === 'proud' ? -3 : 0,
                  })}
                  transition={isSpeaking ? undefined : {
                    duration: status === AVATAR_STATE.THINKING || emotion === 'thinking' ? 0.5 : 3.5,
                    repeat:   status === AVATAR_STATE.THINKING || emotion === 'thinking' ? 0   : Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{
                    width: 24, height: 2.5, borderRadius: 3,
                    background: `linear-gradient(90deg, transparent, ${theme.faceAccent}cc, transparent)`,
                    transformOrigin: 'left center',
                  }}
                />
              </div>

              {/* Eyes */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <Eye
                  blinking={blinking}
                  driftX={eyeDrift.x}
                  driftY={eyeDrift.y}
                  accentColor={theme.faceAccent}
                  pupilColor={theme.pupilColor}
                  isSpeaking={isSpeaking}
                  emotion={emotion}
                />
                <Eye
                  blinking={blinking}
                  driftX={eyeDrift.x * 0.88}
                  driftY={eyeDrift.y * 0.92}
                  accentColor={theme.faceAccent}
                  pupilColor={theme.pupilColor}
                  isSpeaking={isSpeaking}
                  emotion={emotion}
                />
              </div>

              {/* Nose bridge */}
              <div style={{
                width: 3, height: 8, borderRadius: 2,
                background: `linear-gradient(180deg, ${theme.faceAccent}60, transparent)`,
                marginTop: -2, marginBottom: -2,
              }} />

              {/* Jaw / Mouth */}
              <Jaw
                accentColor={theme.faceAccent}
                jawCtrl={jawCtrl}
                isSpeaking={isSpeaking}
                avatarState={status}
                emotion={emotion}
              />

            </motion.div>

            {/* Collar gradient */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 48,
              background: `linear-gradient(180deg, transparent, ${theme.gradTo}77)`,
              borderBottomLeftRadius: '50%', borderBottomRightRadius: '50%',
              pointerEvents: 'none',
            }} />

          </motion.div>
        </motion.div>
      </motion.div>

      {/* Name + LIVE badge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <motion.span
            style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}
            animate={{ opacity: [0.88, 1, 0.88] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {stage === 2 ? 'Connected Concepts Mentor' : 'Memory Coach Mentor'}
          </motion.span>

          <motion.span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 10, padding: '2px 8px', borderRadius: 9999, fontWeight: 600,
              background: theme.outerGlow,
              border: `1px solid ${theme.ringColor}`,
              color: theme.labelColor,
            }}
            animate={isSpeaking ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Radio size={8} style={{ color: theme.labelColor }} />
            LIVE
          </motion.span>
        </div>

        <motion.p
          style={{ fontSize: 12, color: theme.labelColor + 'aa' }}
          animate={{ opacity: [0.55, 0.88, 0.55] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          {stage === 2 ? 'Building your connected mental map' : 'Guiding recall, one question at a time'}
        </motion.p>
      </div>
    </div>
  );
};

export default MentorAvatar;
