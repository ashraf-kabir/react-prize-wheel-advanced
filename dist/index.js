// src/components/PrizeWheel.jsx
import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
  useCallback
} from "react";
import { jsx, jsxs } from "react/jsx-runtime";
var PrizeWheel = forwardRef(function PrizeWheel2({
  segments = [],
  segColors = [],
  onFinished,
  primaryColor = "#d4af37",
  contrastColor = "#ffffff",
  buttonText = "SPIN",
  spinDuration = 5,
  size = 500
}, ref) {
  const canvasRef = useRef(null);
  const angleRef = useRef(-Math.PI / 2);
  const spinningRef = useRef(false);
  const rafRef = useRef(null);
  const [spinning, setSpinning] = useState(false);
  const CENTER = size / 2;
  const RADIUS = CENTER - 16;
  const BTN_R = Math.max(28, size * 0.08);
  const fitText = (ctx, text, maxWidth, maxFontSize = 14, minFontSize = 5) => {
    let fs = maxFontSize;
    ctx.font = `bold ${fs}px system-ui, sans-serif`;
    while (ctx.measureText(text).width > maxWidth && fs > minFontSize) {
      fs -= 0.5;
      ctx.font = `bold ${fs}px system-ui, sans-serif`;
    }
    return fs;
  };
  const draw = useCallback(
    (angle) => {
      const canvas = canvasRef.current;
      if (!canvas || segments.length === 0) return;
      const ctx = canvas.getContext("2d");
      const n = segments.length;
      const arc = 2 * Math.PI / n;
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, RADIUS + 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#0f172a";
      ctx.fill();
      ctx.restore();
      for (let i = 0; i < n; i++) {
        const start = angle + i * arc;
        const end = start + arc;
        const color = segColors[i % segColors.length] || "#888";
        ctx.beginPath();
        ctx.moveTo(CENTER, CENTER);
        ctx.arc(CENTER, CENTER, RADIUS, start, end);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(CENTER, CENTER);
        ctx.arc(CENTER, CENTER, RADIUS - 2, start, end);
        ctx.closePath();
        ctx.clip();
        ctx.translate(CENTER, CENTER);
        ctx.rotate(start + arc / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = contrastColor;
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.shadowBlur = 4;
        const label = segments[i] || "";
        const availableWidth = RADIUS - BTN_R - 18;
        const baseFontMax = n <= 8 ? 15 : n <= 20 ? 13 : n <= 40 ? 11 : 9;
        const fs = fitText(ctx, label, availableWidth, baseFontMax);
        ctx.fillText(label, RADIUS - 10, fs / 3);
        ctx.restore();
      }
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      for (let i = 0; i < n; i++) {
        const a = angle + i * arc;
        ctx.beginPath();
        ctx.moveTo(CENTER, CENTER);
        ctx.lineTo(
          CENTER + RADIUS * Math.cos(a),
          CENTER + RADIUS * Math.sin(a)
        );
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, RADIUS, 0, 2 * Math.PI);
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 5;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, RADIUS - 6, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();
      const grad = ctx.createRadialGradient(
        CENTER - BTN_R * 0.3,
        CENTER - BTN_R * 0.3,
        BTN_R * 0.05,
        CENTER,
        CENTER,
        BTN_R
      );
      grad.addColorStop(0, lighten(primaryColor, 55));
      grad.addColorStop(0.6, primaryColor);
      grad.addColorStop(1, darken(primaryColor, 30));
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, BTN_R, 0, 2 * Math.PI);
      ctx.fillStyle = grad;
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, BTN_R, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      const btnFontSize = Math.min(14, BTN_R * 0.42);
      ctx.fillStyle = "#0f172a";
      ctx.font = `bold ${btnFontSize}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(buttonText, CENTER, CENTER);
    },
    [
      segments,
      segColors,
      primaryColor,
      contrastColor,
      buttonText,
      size,
      CENTER,
      RADIUS,
      BTN_R
    ]
  );
  useEffect(() => {
    draw(angleRef.current);
  }, [draw]);
  const spin = useCallback(() => {
    if (spinningRef.current || segments.length < 2) return;
    spinningRef.current = true;
    setSpinning(true);
    const n = segments.length;
    const arc = 2 * Math.PI / n;
    const winnerIndex = Math.floor(Math.random() * n);
    const winnerMidAngle = winnerIndex * arc + arc / 2;
    const startAngle = angleRef.current;
    const TAU = 2 * Math.PI;
    const currentNorm = (startAngle % TAU + TAU) % TAU;
    const targetNorm = ((-Math.PI / 2 - winnerMidAngle) % TAU + TAU) % TAU;
    let forwardArc = targetNorm - currentNorm;
    if (forwardArc <= 0) forwardArc += TAU;
    const minFullSpins = Math.max(6, spinDuration * 2);
    const delta = forwardArc + minFullSpins * TAU;
    const startTime = performance.now();
    const durationMs = spinDuration * 1e3;
    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      angleRef.current = startAngle + delta * eased;
      draw(angleRef.current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        spinningRef.current = false;
        setSpinning(false);
        try {
          if (onFinished && typeof onFinished === "function") {
            onFinished(winnerIndex);
          }
        } catch (error) {
          console.error("Error in onFinished callback:", error);
        }
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [segments.length, spinDuration, draw, onFinished]);
  useImperativeHandle(ref, () => ({ click: spin }), [spin]);
  useEffect(
    () => () => rafRef.current && cancelAnimationFrame(rafRef.current),
    []
  );
  if (segments.length === 0) return null;
  const ptrW = Math.round(size * 0.074);
  const ptrH = Math.round(size * 0.118);
  const ballR = Math.round(ptrW * 0.5);
  const overlap = Math.round(ptrH * 0.2);
  const half = ptrW / 2;
  const tipY = ptrH;
  const bodyPath = [
    `M ${half} ${tipY}`,
    `C ${ptrW * 0.15} ${ptrH * 0.62}, 3 ${ptrH * 0.35}, 3 ${ballR}`,
    `A ${half - 3} ${half - 3} 0 0 1 ${ptrW - 3} ${ballR}`,
    `C ${ptrW - 3} ${ptrH * 0.35}, ${ptrW * 0.85} ${ptrH * 0.62}, ${half} ${tipY}`,
    "Z"
  ].join(" ");
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        position: "relative",
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        userSelect: "none"
      },
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              position: "relative",
              zIndex: 20,
              marginBottom: -overlap,
              filter: `drop-shadow(0 5px 10px rgba(0,0,0,0.65)) drop-shadow(0 2px 4px rgba(0,0,0,0.4))`,
              lineHeight: 0
            },
            children: /* @__PURE__ */ jsxs(
              "svg",
              {
                width: ptrW,
                height: ptrH,
                viewBox: `0 0 ${ptrW} ${ptrH}`,
                xmlns: "http://www.w3.org/2000/svg",
                overflow: "visible",
                children: [
                  /* @__PURE__ */ jsxs("defs", { children: [
                    /* @__PURE__ */ jsxs("linearGradient", { id: "ptrBody", x1: "0%", y1: "0%", x2: "100%", y2: "100%", children: [
                      /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: lighten(primaryColor, 65) }),
                      /* @__PURE__ */ jsx("stop", { offset: "40%", stopColor: primaryColor }),
                      /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: darken(primaryColor, 45) })
                    ] }),
                    /* @__PURE__ */ jsxs("radialGradient", { id: "ptrShine", cx: "38%", cy: "28%", r: "58%", children: [
                      /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "rgba(255,255,255,0.6)" }),
                      /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "rgba(255,255,255,0)" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx(
                    "path",
                    {
                      d: bodyPath,
                      fill: "url(#ptrBody)",
                      stroke: darken(primaryColor, 25),
                      strokeWidth: "1.5",
                      strokeLinejoin: "round"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "ellipse",
                    {
                      cx: half,
                      cy: ballR * 0.82,
                      rx: ptrW * 0.26,
                      ry: ballR * 0.36,
                      fill: "url(#ptrShine)"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "circle",
                    {
                      cx: half,
                      cy: ballR,
                      r: half - 3,
                      fill: "none",
                      stroke: "rgba(255,255,255,0.45)",
                      strokeWidth: "1.2"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "circle",
                    {
                      cx: half * 0.72,
                      cy: ballR * 0.58,
                      r: ptrW * 0.07,
                      fill: "rgba(255,255,255,0.7)"
                    }
                  )
                ]
              }
            )
          }
        ),
        /* @__PURE__ */ jsx(
          "canvas",
          {
            ref: canvasRef,
            width: size,
            height: size,
            onClick: spin,
            style: {
              borderRadius: "50%",
              cursor: spinning ? "default" : "pointer",
              display: "block",
              maxWidth: "100%"
            }
          }
        )
      ]
    }
  );
});
var PrizeWheel_default = PrizeWheel;
function lighten(hex, amount) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, (num >> 8 & 255) + amount);
  const b = Math.min(255, (num & 255) + amount);
  return `rgb(${r},${g},${b})`;
}
function darken(hex, amount) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, (num >> 8 & 255) - amount);
  const b = Math.max(0, (num & 255) - amount);
  return `rgb(${r},${g},${b})`;
}
export {
  PrizeWheel_default as default
};
