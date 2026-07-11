"use client";

import { FunctionComponent, JSX, MouseEvent, useRef, useState } from "react";
import { VideoPlayerProps } from "../types/common.types";

const POSTERS = [
  "/images/videoposter.png",
  "/images/videoposter1.png",
  "/images/videoposter2.png",
  "/images/videoposter3.png",
  "/images/videoposter4.png",
  "/images/videoposter5.png",
  "/images/videoposter6.png",
  "/images/videoposter7.png",
  "/images/videoposter8.png",
  "/images/videoposter9.png",
  "/images/videoposter10.png",
  "/images/videoposter11.png",
  "/images/videoposter12.png",
  "/images/videoposter13.png",
  "/images/videoposter14.png",
  "/images/videoposter15.png",
];

const fmt = (s: number): string => {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r < 10 ? "0" : ""}${r}`;
};

const VideoPlayer: FunctionComponent<VideoPlayerProps> = ({
  src,
}): JSX.Element => {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState<boolean>(false);
  const [time, setTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [poster] = useState<string>(
    () => POSTERS[Math.floor(Math.random() * POSTERS.length)],
  );

  const toggle = (): void => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const seek = (e: MouseEvent<HTMLDivElement>): void => {
    const v = ref.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(
      Math.max((e.clientX - rect.left) / rect.width, 0),
      1,
    );
    v.currentTime = ratio * duration;
    setTime(v.currentTime);
  };

  const toggleMute = (): void => {
    const v = ref.current;
    const next = !muted;
    setMuted(next);
    if (v) v.muted = next;
  };

  const setVolumeAt = (e: MouseEvent<HTMLDivElement>): void => {
    const v = ref.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(
      Math.max((e.clientX - rect.left) / rect.width, 0),
      1,
    );
    setVolume(ratio);
    if (v) {
      v.volume = ratio;
      if (muted) {
        setMuted(false);
        v.muted = false;
      }
    }
  };

  const pct = duration ? (time / duration) * 100 : 0;

  return (
    <div className="relative flex flex-col w-full gap-1">
      <div className="relative flex w-full">
        <video
          ref={ref}
          src={src}
          poster={poster}
          onClick={toggle}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={() => setPlaying(false)}
          className="relative flex w-full cursor-blacksmithHS"
        />
      </div>
      <div className="relative flex flex-row items-center gap-2 bg-[url(/images/bg.png)] bg-cover bg-center px-2 py-1">
        <button
          onClick={toggle}
          className="relative flex bg-[url(/images/cajatexto.png)] bg-[length:100%_100%] bg-no-repeat px-3 py-1 text-xs cursor-blacksmithHS"
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <span className="relative flex shrink-0 text-[10px] text-gray-300">
          {fmt(time)} / {fmt(duration)}
        </span>
        <div
          onClick={seek}
          className="relative flex flex-1 h-2 bg-black/40 cursor-blacksmithHS"
        >
          <div
            className="relative flex h-full bg-white/70"
            style={{ width: `${pct}%` }}
          />
        </div>
        <button
          onClick={toggleMute}
          aria-label={muted ? "unmute" : "mute"}
          className="relative flex shrink-0 w-5 h-5 cursor-blacksmithHS"
        >
          <img
            src={muted ? "/images/muted.png" : "/images/music.png"}
            alt=""
            draggable={false}
            className="relative flex w-full h-full object-contain"
          />
        </button>
        <div
          onClick={setVolumeAt}
          className="relative flex w-14 h-2 shrink-0 bg-black/40 cursor-blacksmithHS"
        >
          <div
            className="relative flex h-full bg-white/70"
            style={{ width: `${(muted ? 0 : volume) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
