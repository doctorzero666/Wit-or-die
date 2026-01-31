import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState
} from "react";
import { motion, useAnimation } from "framer-motion";

export type VictoryPlayArgs = {
  amount: string;
};

export type VictoryTrophyOverlayHandle = {
  play: (args: VictoryPlayArgs) => Promise<void>;
};

type VictoryTrophyOverlayProps = {
  onDone?: () => void;
  lockPointerEvents?: boolean;
  dimBackground?: number;
  trophyWidthStyle?: string;
};

const trophySrc = "/image_award.png";

export const VictoryTrophyOverlay = forwardRef<
  VictoryTrophyOverlayHandle,
  VictoryTrophyOverlayProps
>(function VictoryTrophyOverlay(
  {
    onDone,
    lockPointerEvents = true,
    dimBackground = 0.12,
    trophyWidthStyle = "min(680px, 86vw)"
  },
  ref
) {
  const [visible, setVisible] = useState(false);
  const [amount, setAmount] = useState("0.0 ETH");
  const [awaitingClick, setAwaitingClick] = useState(false);
  const isPlayingRef = useRef(false);
  const clickResolveRef = useRef<(() => void) | null>(null);

  const overlayControls = useAnimation();
  const trophyControls = useAnimation();

  const play = useCallback(
    async ({ amount }: VictoryPlayArgs) => {
      if (isPlayingRef.current) {
        return;
      }
      isPlayingRef.current = true;
      setVisible(true);
      setAmount(amount);
      setAwaitingClick(false);

      await overlayControls.set({ opacity: 1 });
      await trophyControls.set({ y: 260, opacity: 0, scale: 0.92 });

      await trophyControls.start({
        y: 0,
        opacity: 1,
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 220,
          damping: 22,
          duration: 0.45
        }
      });

      setAwaitingClick(true);
      await new Promise<void>((resolve) => {
        clickResolveRef.current = resolve;
      });
      clickResolveRef.current = null;
      setAwaitingClick(false);

      await Promise.all([
        trophyControls.start({
          y: 260,
          opacity: 0,
          transition: { duration: 0.25 }
        }),
        overlayControls.start({
          opacity: 0,
          transition: { duration: 0.22 }
        })
      ]);

      setVisible(false);
      isPlayingRef.current = false;
      onDone?.();
    },
    [onDone, overlayControls, trophyControls]
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
          clickResolveRef.current();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        background: `rgba(0,0,0,${dimBackground})`,
        pointerEvents: lockPointerEvents || awaitingClick ? "auto" : "none"
      }}
    >
      <motion.img
        src={trophySrc}
        alt="trophy"
        animate={trophyControls}
        style={{
          width: trophyWidthStyle,
          height: "auto",
          imageRendering: "pixelated",
          userSelect: "none",
          pointerEvents: "none"
        }}
      />
      <div
        style={{
          color: "#2dff6a",
          border: "2px solid #2dff6a",
          padding: "8px 14px",
          letterSpacing: "0.2em",
          textTransform: "uppercase"
        }}
      >
        Reward: {amount}
      </div>
      <div
        style={{
          color: "#ffffff",
          letterSpacing: "0.2em",
          textTransform: "uppercase"
        }}
      >
        CLICK TO CONTINUE
      </div>
    </motion.div>
  );
});
