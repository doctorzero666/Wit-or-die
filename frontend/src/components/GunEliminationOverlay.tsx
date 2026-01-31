import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react";
import { motion, useAnimation } from "framer-motion";

export type GunEliminationPlayArgs = {
  eliminated: boolean;
};

export type GunEliminationOverlayHandle = {
  play: (args: GunEliminationPlayArgs) => Promise<void>;
};

export type GunEliminationOverlayProps = {
  onDone?: (args: GunEliminationPlayArgs) => void;
  lockPointerEvents?: boolean;
  dimBackground?: number;
  crackHoldMs?: number;
  fireFrameHoldMs?: number;
  gunWidthStyle?: string;
};

const idleSrc = "/image_枪口.png";
const fireSrc = "/image2_开枪.png";
const crackSrc = "/image_击碎屏幕.png";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const GunEliminationOverlay = forwardRef<
  GunEliminationOverlayHandle,
  GunEliminationOverlayProps
>(function GunEliminationOverlay(
  {
    onDone,
    lockPointerEvents = false,
    dimBackground = 0.1,
    crackHoldMs = 650,
    fireFrameHoldMs = 90,
    gunWidthStyle = "min(520px, 78vw)"
  },
  ref
) {
  const [visible, setVisible] = useState(false);
  const [crackVisible, setCrackVisible] = useState(false);
  const [gunSrc, setGunSrc] = useState(idleSrc);
  const [processedIdle, setProcessedIdle] = useState<string | null>(null);
  const [processedFire, setProcessedFire] = useState<string | null>(null);
  const [awaitingClick, setAwaitingClick] = useState(false);
  const isPlayingRef = useRef(false);
  const clickResolveRef = useRef<(() => void) | null>(null);
  const clickArmedRef = useRef(false);
  const clickEnabledAtRef = useRef(0);
  const mountedRef = useRef(false);

  const overlayControls = useAnimation();
  const gunControls = useAnimation();
  const crackControls = useAnimation();

  const safeStart = useCallback(
    async (controls: ReturnType<typeof useAnimation>, animation: any) => {
      if (!mountedRef.current) {
        return;
      }
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (!mountedRef.current) {
        return;
      }
      await controls.start(animation);
    },
    []
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const removeWhiteBackground = async (src: string) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = src;
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return src;
      }
      ctx.drawImage(image, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const threshold = 235;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r >= threshold && g >= threshold && b >= threshold) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      return canvas.toDataURL("image/png");
    };

    let canceled = false;
    (async () => {
      try {
        const [idle, fire] = await Promise.all([
          removeWhiteBackground(idleSrc),
          removeWhiteBackground(fireSrc)
        ]);
        if (!canceled) {
          setProcessedIdle(idle);
          setProcessedFire(fire);
        }
      } catch {
        if (!canceled) {
          setProcessedIdle(null);
          setProcessedFire(null);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, []);

  const play = useCallback(
    async ({ eliminated }: GunEliminationPlayArgs) => {
      if (isPlayingRef.current) {
        return;
      }
      if (!mountedRef.current) {
        return;
      }
      isPlayingRef.current = true;
      setVisible(true);
      setCrackVisible(false);
      setAwaitingClick(false);
      setGunSrc(processedIdle ?? idleSrc);

      // wait a frame so motion components are mounted
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await overlayControls.set({ opacity: 1, x: 0, y: 0 });
      await gunControls.set({ y: 260, opacity: 0, scale: 0.92, rotate: 0 });
      await crackControls.set({ opacity: 0 });

      // Phase 1: enter
      await safeStart(gunControls, {
        y: 0,
        opacity: 1,
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 220,
          damping: 20,
          duration: 0.45
        }
      });
      if (!mountedRef.current) {
        return;
      }

      // Phase 2: sway
      await safeStart(gunControls, {
        rotate: [0, -1.2, 1.2, -0.8, 0],
        transition: { duration: 0.18 }
      });
      if (!mountedRef.current) {
        return;
      }

      // Phase 3: fire + recoil + shake
      setGunSrc(processedFire ?? fireSrc);
      await Promise.all([
        safeStart(gunControls, {
          y: [0, 10, 0],
          scale: [1, 0.985, 1],
          transition: { duration: 0.14 }
        }),
        safeStart(overlayControls, {
          x: [0, -10, 8, -6, 4, 0],
          y: [0, 6, -5, 4, -2, 0],
          transition: { duration: 0.16 }
        })
      ]);
      if (!mountedRef.current) {
        return;
      }
      await sleep(fireFrameHoldMs);
      setGunSrc(processedIdle ?? idleSrc);

      // Phase 4: result
      await sleep(120);
      if (eliminated) {
        setCrackVisible(true);
        await safeStart(crackControls, {
          opacity: [0, 1],
          transition: { duration: 0.18 }
        });
        if (!mountedRef.current) {
          return;
        }
        await sleep(crackHoldMs);
        setAwaitingClick(true);
        clickArmedRef.current = false;
        clickEnabledAtRef.current = performance.now() + 400;
        setTimeout(() => {
          clickArmedRef.current = true;
        }, 400);
        await new Promise<void>((resolve) => {
          clickResolveRef.current = resolve;
        });
        clickResolveRef.current = null;
        setAwaitingClick(false);
      }

      // Phase 5: exit
      await Promise.all([
        safeStart(gunControls, {
          y: 260,
          opacity: 0,
          transition: { duration: 0.25 }
        }),
        safeStart(overlayControls, {
          opacity: 0,
          transition: { duration: 0.22 }
        })
      ]);
      if (!mountedRef.current) {
        return;
      }

      setCrackVisible(false);
      setVisible(false);
      isPlayingRef.current = false;
      onDone?.({ eliminated });
    },
    [
      overlayControls,
      gunControls,
      crackControls,
      safeStart,
      fireFrameHoldMs,
      crackHoldMs,
      onDone
    ]
  );

  useImperativeHandle(ref, () => ({ play }), [play]);

  if (!visible) {
    return null;
  }

  return (
    <motion.div
      animate={overlayControls}
      onClick={() => {
        if (awaitingClick && clickResolveRef.current) {
          if (performance.now() < clickEnabledAtRef.current) {
            return;
          }
          if (!clickArmedRef.current) {
            return;
          }
          clickResolveRef.current();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `rgba(0,0,0,${dimBackground})`,
        pointerEvents: lockPointerEvents || awaitingClick ? "auto" : "none"
      }}
    >
      <motion.img
        src={gunSrc}
        alt="gun"
        animate={gunControls}
        style={{
          width: gunWidthStyle,
          height: "auto",
          imageRendering: "pixelated",
          userSelect: "none",
          pointerEvents: "none"
        }}
      />
      {crackVisible ? (
        <motion.img
          src={crackSrc}
          alt="crack"
          animate={crackControls}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            imageRendering: "pixelated",
            pointerEvents: "none"
          }}
        />
      ) : null}
      {awaitingClick ? (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "absolute",
            bottom: "8vh",
            border: "2px solid #ffffff",
            padding: "12px 20px",
            background: "rgba(0,0,0,0.85)",
            color: "#ffffff",
            textTransform: "uppercase",
            letterSpacing: "0.2em"
          }}
        >
          YOU DIED · CLICK TO CONTINUE
        </motion.div>
      ) : null}
    </motion.div>
  );
});
