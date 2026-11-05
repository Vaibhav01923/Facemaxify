import React from "react";
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "../Audio";
import type { VideoProps } from "../../shared/types";
import { scoreColor } from "../../shared/format";
import { PROMO } from "../../shared/promo";
import { NARRATION_LEAD } from "../../shared/timing";
import { Brand } from "../components/Brand";
import { Caption } from "../components/Caption";
import { useLayout } from "../layout";
import { COLORS, FONT, easeOutBack, easeOutCubic, prog } from "../theme";

const Row: React.FC<{ name: string; score: number; start: number }> = ({ name, score, start }) => {
  const frame = useCurrentFrame();
  const k = easeOutCubic(prog(frame, start, 14));
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "13px 0",
        borderBottom: "1.5px solid rgba(255,255,255,0.1)",
        opacity: k,
        transform: `translateX(${(1 - k) * 30}px)`,
        fontFamily: FONT,
        fontSize: 34,
        fontWeight: 700,
        color: "#e6e8f8",
      }}
    >
      <span>{name}</span>
      <span style={{ color: scoreColor(score), fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{score.toFixed(1)}</span>
    </div>
  );
};

const Column: React.FC<{ title: string; color: string; rows: { short: string; score: number }[]; start: number; step: number }> = ({
  title,
  color,
  rows,
  start,
  step,
}) => {
  const frame = useCurrentFrame();
  const k = easeOutCubic(prog(frame, start, 12));
  return (
    <div style={{ flex: 1 }}>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: "0.2em",
          color,
          opacity: k,
          paddingBottom: 10,
          borderBottom: `3px solid ${color}`,
        }}
      >
        {title}
      </div>
      {rows.map((r, i) => (
        <Row key={r.short} name={r.short} score={r.score} start={start + step + i * step} />
      ))}
    </div>
  );
};

const Ring: React.FC<{ video: VideoProps; size: number; t: (n: number) => number }> = ({ video, size, t }) => {
  const frame = useCurrentFrame();
  const { outro } = video;
  const R = size / 2 - 22;
  const circ = 2 * Math.PI * R;
  const photo = size - 96;
  const ringK = easeOutCubic(prog(frame, t(10), t(56)));
  const ringColor = scoreColor(outro.overall100 / 10);
  const pop = easeOutBack(prog(frame, t(8), t(16)));
  const dash = `${circ * (outro.overall100 / 100) * ringK} ${circ}`;
  const imgPx = photo / 0.6;
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        transform: `scale(${0.85 + 0.15 * pop})`,
        opacity: easeOutCubic(prog(frame, 0, 10)),
      }}
    >
      <svg width={size} height={size} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={22} />
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={ringColor} strokeWidth={38} opacity={0.2} strokeDasharray={dash} strokeLinecap="round" />
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={ringColor} strokeWidth={22} strokeDasharray={dash} strokeLinecap="round" />
      </svg>
      <div
        style={{
          position: "absolute",
          left: (size - photo) / 2,
          top: (size - photo) / 2,
          width: photo,
          height: photo,
          borderRadius: "50%",
          overflow: "hidden",
          boxShadow: "0 0 0 4px rgba(255,255,255,0.14)",
        }}
      >
        <Img
          src={video.imageSrc}
          style={{
            position: "absolute",
            left: photo / 2 - 0.5 * imgPx,
            top: photo / 2 - 0.46 * imgPx,
            width: imgPx,
            height: imgPx,
            maxWidth: "none",
          }}
        />
      </div>
    </div>
  );
};

const ScoreBlock: React.FC<{ video: VideoProps; t: (n: number) => number; numberSize: number; align: "center" | "left" }> = ({
  video,
  t,
  numberSize,
  align,
}) => {
  const frame = useCurrentFrame();
  const { outro } = video;
  const ringK = easeOutCubic(prog(frame, t(10), t(56)));
  const ringColor = scoreColor(outro.overall100 / 10);
  const pill = easeOutBack(prog(frame, t(56), t(14)));
  return (
    <div style={{ textAlign: align, fontFamily: FONT }}>
      <div style={{ display: "inline-flex", alignItems: "baseline" }}>
        <span
          style={{
            fontSize: numberSize,
            fontWeight: 800,
            lineHeight: 1,
            color: ringColor,
            letterSpacing: "-0.04em",
            fontVariantNumeric: "tabular-nums",
            textShadow: `0 0 60px ${ringColor}66`,
          }}
        >
          {Math.round(outro.overall100 * ringK)}
        </span>
        <span style={{ fontSize: numberSize * 0.27, fontWeight: 700, color: COLORS.muted, marginLeft: 8 }}>/100</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "0.22em", color: COLORS.muted, marginTop: 4 }}>
        FACIAL HARMONY SCORE
      </div>
      <div
        style={{
          display: "inline-block",
          marginTop: 22,
          fontSize: 48,
          fontWeight: 800,
          color: "#04050f",
          padding: "12px 40px",
          borderRadius: 999,
          background: `linear-gradient(135deg, ${COLORS.cyan}, #818cf8)`,
          transform: `scale(${0.6 + 0.4 * pill})`,
          opacity: Math.min(1, pill),
          transformOrigin: align === "left" ? "0% 50%" : "50% 50%",
        }}
      >
        {outro.percentileText}
      </div>
    </div>
  );
};

const Check: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{ flex: "none" }}>
    <defs>
      <linearGradient id="chk" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={COLORS.cyan} />
        <stop offset="1" stopColor="#818cf8" />
      </linearGradient>
    </defs>
    <circle cx="20" cy="20" r="19" fill="url(#chk)" />
    <path d="M11 20.5 L17.5 27 L29.5 13.5" fill="none" stroke="#04050f" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LinkIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#04050f" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
    <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2" />
    <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" />
  </svg>
);

/** "Free analysis - link in bio" headline and the checklist of selling points (text lives in shared/promo.ts). */
const Promo: React.FC<{ start: number; step: number; wide: boolean; pill?: string }> = ({ start, step, wide, pill = PROMO.pill }) => {
  const frame = useCurrentFrame();
  const head = easeOutBack(prog(frame, start, 14));
  const pulse = 1 + 0.02 * Math.sin(frame / 6);
  const align = wide ? "left" : "center";
  return (
    <div style={{ fontFamily: FONT, textAlign: align }}>
      <div
        style={{
          fontSize: wide ? 72 : 60,
          fontWeight: 800,
          letterSpacing: "-0.01em",
          color: "#fff",
          opacity: Math.min(1, head),
          transform: `translateY(${(1 - Math.min(1, head)) * 24}px)`,
          lineHeight: 1.05,
        }}
      >
        {PROMO.headline}
      </div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 14,
          marginTop: 14,
          padding: wide ? "12px 34px" : "10px 30px",
          borderRadius: 999,
          // long wording (e.g. "LINK IN ABOUT + PINNED COMMENT") gets a smaller size so it fits the 9:16 width
          fontSize: wide ? 40 : pill.length > 22 ? 31 : 38,
          fontWeight: 800,
          letterSpacing: pill.length > 22 ? "0.05em" : "0.1em",
          color: "#04050f",
          background: `linear-gradient(135deg, ${COLORS.cyan}, #818cf8)`,
          boxShadow: `0 0 40px ${COLORS.cyan}55`,
          opacity: Math.min(1, head),
          transform: `scale(${(0.7 + 0.3 * head) * pulse})`,
          transformOrigin: wide ? "0% 50%" : "50% 50%",
        }}
      >
        <LinkIcon size={wide ? 40 : 36} />
        {pill}
      </div>
      <div
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 12,
          marginTop: wide ? 28 : 26,
        }}
      >
        {PROMO.bullets.map((text, i) => {
          const k = easeOutCubic(prog(frame, start + 14 + i * step, 14));
          return (
            <div
              key={text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                fontSize: wide ? 38 : 34,
                fontWeight: 700,
                color: "#e8eaf8",
                textAlign: "left",
                opacity: k,
                transform: `translateX(${(1 - k) * (wide ? -40 : 0)}px) translateY(${(1 - k) * (wide ? 0 : 18)}px)`,
              }}
            >
              <Check size={wide ? 46 : 42} />
              <span>{text}</span>
            </div>
          );
        })}
      </div>
      {PROMO.domain && (
        <div
          style={{
            marginTop: wide ? 26 : 22,
            fontSize: wide ? 30 : 28,
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: COLORS.muted,
            opacity: easeOutCubic(prog(frame, start + 22 + PROMO.bullets.length * step, 14)),
          }}
        >
          {PROMO.domain}
        </div>
      )}
    </div>
  );
};

export const OutroScene: React.FC<{ video: VideoProps }> = ({ video }) => {
  const { wide } = useLayout();
  const { outro } = video;
  // the short plays the same animation faster so the result screen fits in a few seconds
  const speed = video.format === "short" ? 1.3 : 1;
  const t = (n: number) => Math.round(n / speed);
  const step = Math.max(5, Math.round(8 / speed));
  const promoStart = t(100);
  const bulletStep = Math.max(6, Math.round(10 / speed));

  const audio = (
    <>
      {outro.audioSrc && (
        <Sequence from={NARRATION_LEAD} layout="none">
          <Audio src={outro.audioSrc} />
        </Sequence>
      )}
      {video.sfx && (
        <>
          <Sequence from={4} layout="none">
            <Audio src={staticFile("sfx/riser.wav")} volume={0.35} />
          </Sequence>
          <Sequence from={t(64)} layout="none">
            <Audio src={staticFile("sfx/impact.wav")} volume={0.5} />
          </Sequence>
          <Sequence from={t(64)} layout="none">
            <Audio src={staticFile("sfx/ding_hi.wav")} volume={0.45} />
          </Sequence>
          <Sequence from={promoStart} layout="none">
            <Audio src={staticFile("sfx/zip.wav")} volume={0.4} />
          </Sequence>
          {PROMO.bullets.map((_, i) => (
            <Sequence key={i} from={promoStart + 14 + i * bulletStep} layout="none">
              <Audio src={staticFile("sfx/pop.wav")} volume={0.35} />
            </Sequence>
          ))}
        </>
      )}
    </>
  );

  if (wide) {
    return (
      <AbsoluteFill>
        <Brand right="RESULT" />
        <div style={{ position: "absolute", left: 110, top: 118 }}>
          <Ring video={video} size={500} t={t} />
        </div>
        <div style={{ position: "absolute", left: 110, width: 500, top: 640 }}>
          <ScoreBlock video={video} t={t} numberSize={170} align="center" />
        </div>

        <div style={{ position: "absolute", left: 800, right: 70, top: 120, display: "flex", gap: 56 }}>
          <Column title="STRENGTHS" color="#34d399" rows={outro.strengths} start={t(74)} step={step} />
          {outro.weaknesses.length > 0 && (
            <Column title="WEAK POINTS" color="#fb923c" rows={outro.weaknesses} start={t(84)} step={step} />
          )}
        </div>
        <div style={{ position: "absolute", left: 800, right: 70, top: 395 }}>
          <Promo start={promoStart} step={bulletStep} wide pill={video.publicMode ? "FREE AT FACEMAXIFY.COM" : undefined} />
        </div>
        {outro.narration && (
          <Caption
            text={outro.narration}
            start={NARRATION_LEAD}
            frames={outro.audioFrames}
            left={800}
            top={870}
            width={1040}
            size={27}
          />
        )}
        {audio}
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      <Brand right="RESULT" />
      <div style={{ position: "absolute", left: (1080 - 420) / 2, top: 140 }}>
        <Ring video={video} size={420} t={t} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 580 }}>
        <ScoreBlock video={video} t={t} numberSize={190} align="center" />
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 975, display: "flex", gap: 44 }}>
        <Column title="STRENGTHS" color="#34d399" rows={outro.strengths} start={t(74)} step={step} />
        {outro.weaknesses.length > 0 && (
          <Column title="WEAK POINTS" color="#fb923c" rows={outro.weaknesses} start={t(84)} step={step} />
        )}
      </div>
      <div style={{ position: "absolute", left: 40, right: 40, top: 1300 }}>
        <Promo start={promoStart} step={bulletStep} wide={false} pill={video.publicMode ? "FREE AT FACEMAXIFY.COM" : undefined} />
      </div>
      {audio}
    </AbsoluteFill>
  );
};
