import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "../Audio";
import type { MetricScene, VideoProps } from "../../shared/types";
import { buildVisual } from "../../shared/visuals";
import { NARRATION_LEAD } from "../../shared/timing";
import { Brand } from "../components/Brand";
import { Caption } from "../components/Caption";
import { FaceCard } from "../components/FaceCard";
import { InfoPanel } from "../components/InfoPanel";
import { MeasureOverlay } from "../components/MeasureOverlay";
import { cameraAt, targetFor } from "../components/camera";
import { useLayout } from "../layout";

/** Frame (within a scene) at which the lines start drawing and the score is revealed. */
export const TIMELINE = {
  short: { draw: 14, reveal: 48 },
  long: { draw: 18, reveal: 62 },
};

const dingFor = (score: number) => (score >= 7 ? "ding_hi" : score >= 5 ? "ding_mid" : "bonk");

export const MetricSceneView: React.FC<{
  scene: MetricScene;
  index: number;
  total: number;
  video: VideoProps;
}> = ({ scene, index, total, video }) => {
  const frame = useCurrentFrame();
  const { wide, card } = useLayout();
  const T = TIMELINE[video.format];

  const visual = useMemo(
    () =>
      buildVisual(scene.key, {
        L: video.landmarks,
        value: scene.value,
        unit: scene.unit,
        score: scene.score,
      }),
    [scene.key, scene.value, scene.unit, scene.score, video.landmarks]
  );
  const target = useMemo(() => targetFor(visual.focus), [visual]);
  const camera = cameraAt(target, frame, scene.durationInFrames, card.size);

  return (
    <AbsoluteFill>
      <Brand right={`${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`} />
      <FaceCard image={video.imageSrc} camera={camera}>
        <MeasureOverlay
          prims={visual.prims}
          map={camera.map}
          zoom={camera.zoom}
          size={card.size}
          frame={frame}
          start={T.draw}
          score={scene.score}
        />
      </FaceCard>
      <InfoPanel scene={scene} index={index} total={total} reveal={T.reveal} />
      {wide && scene.narration && (
        <Caption
          text={scene.narration}
          start={NARRATION_LEAD}
          frames={scene.audioFrames}
          left={1010}
          top={812}
          width={850}
          size={30}
        />
      )}

      {scene.audioSrc && (
        <Sequence from={NARRATION_LEAD} layout="none">
          <Audio src={scene.audioSrc} />
        </Sequence>
      )}
      {video.sfx && (
        <>
          <Sequence from={T.draw} layout="none">
            <Audio src={staticFile("sfx/zip.wav")} volume={0.5} />
          </Sequence>
          <Sequence from={T.reveal} layout="none">
            <Audio src={staticFile(`sfx/${dingFor(scene.score)}.wav`)} volume={0.55} />
          </Sequence>
        </>
      )}
    </AbsoluteFill>
  );
};
