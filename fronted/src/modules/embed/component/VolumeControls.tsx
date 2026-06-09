import React, { useCallback, useEffect, useRef, useState } from "react";
import {motion} from "motion/react"
function VolumeControls({
  videoRef,
  iconColor,
  trackColor,
  // accentColor
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  iconColor: string;
  trackColor: string;
  // accentColor:string
}) {
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
  if (inputRef.current) {
    inputRef.current.style.setProperty("--volume-pct", `${volume * 100}%`);
  }
}, []);

  useEffect(() => {
    if (videoRef.current) {
      setVolume(videoRef.current.volume);
      setIsMuted(videoRef.current.muted);
    }
  }, [videoRef]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    e.target.style.setProperty("--volume-pct", `${newVolume * 100}%`);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      if (newVolume > 0 && isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const next = !isMuted;
      videoRef.current.muted = next;
      setIsMuted(next);
    }
  };

  const displayVolume = isMuted ? 0 : volume;


  const setSliderRef = useCallback((el: HTMLInputElement | null) => {
  (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
  if (el) {
    const pct = isMuted ? 0 : volume * 100;
    el.style.setProperty("--volume-pct", `${pct}%`);
  }
}, [volume, isMuted]); // re-runs if volume/mute state changes on mount
  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      {showSlider && (
        <div
          ref={sliderContainerRef}
          className="absolute bottom-full mb-0.5 flex flex-col items-center bg-black/65 border border-white/10 px-3 py-4 rounded-lg shadow-2xl z-50 animate-slideUp"
          style={{ width: 36, height: 110 , "--track-fill": trackColor  } as React.CSSProperties}
        >
          <input
          ref={setSliderRef}
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={displayVolume}
            onChange={handleVolumeChange}
            aria-label="Volume"
            style={{
              // ── orientation trick that actually works in 2025 ──
              writingMode: "vertical-lr" as any,
              direction: "rtl",         // top = loud, bottom = silent
              appearance: "none",
              WebkitAppearance: "none", // kill native chrome rendering
              width: "100%",
              height: "100%",
              background: "transparent",
              cursor: "pointer",
              outline: "none",
              padding: 0,
              margin: 0,
            }}
            className="volume-range"
          />
        </div>
      )}
{/* <motion></motion> */}
      <button
      // whileHover={{color:accentColor}}
        onClick={toggleMute}
        style={{ color: iconColor }}
        className="w-full h-full p-2 transition-colors duration-200 focus:outline-none"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted || volume === 0 ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
          </svg>
        ) : volume < 0.5 ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default VolumeControls;