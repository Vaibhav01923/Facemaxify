import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "../Audio";
import type { VideoProps } from "../../shared/types";
import { NARRATION_LEAD } from "../../shared/timing";
import { Brand } from "../components/Brand";
import { PromoCard } from "../components/PromoCard";
import { useLayout } from "../layout";

/** Short mid-video moment: the "get your free analysis" card, with the line spoken over it. */
export const PromoScene: React.FC<{ video: VideoProps }> = ({ video }) => {
  const { wide } = useLayout();
  const promo = video.promo!;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "rgba(5,5,16,0.62)" }} />
      <Brand right="AI FACE ANALYSIS" />
      {wide ? <PromoCard width={1300} top={420} start={4} scale={1.15} /> : <PromoCard width={960} top={760} start={4} scale={1.05} />}
      {promo.audioSrc && (
        <Sequence from={NARRATION_LEAD} layout="none">
          <Audio src={promo.audioSrc} />
        </Sequence>
      )}
      {video.sfx && (
        <Sequence from={0} layout="none">
          <Audio src={staticFile("sfx/whoosh_b.wav")} volume={0.35} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
