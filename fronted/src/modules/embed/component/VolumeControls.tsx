import React, { useEffect, useRef, useState } from 'react'

function VolumeControls({videoRef}:{videoRef:React.RefObject<HTMLVideoElement | null>;}) {

    const [volume, setVolume] = useState(1); // 1 = 100% volume
  const [isMuted, setIsMuted] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      setVolume(videoRef.current.volume);
      setIsMuted(videoRef.current.muted);
    }
  }, [videoRef]);


  console.log(volume,"video-volume")
  // Handle slider drag interaction
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      // Automatically unmute if user adjusts the slider up
      if (newVolume > 0 && isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  // Toggle Mute click action
  const toggleMute = () => {
    if (videoRef.current) {
      const nextMuteState = !isMuted;
      videoRef.current.muted = nextMuteState;
      setIsMuted(nextMuteState);
    }
  };

  return (
    <div 
      className="relative flex flex-col items-center"
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      {/* 🚀 THE VIMEO OVERLAY PANEL (Takes up zero row space) */}
      {showSlider && (
        <div 
          ref={sliderContainerRef}
          className="absolute bottom-full mb-3 flex flex-col items-center bg-[#141212] border border-white/10 px-3 py-4 rounded-md shadow-2xl h-28 w-10 z-50 animate-slideUp"
        >
          {/* Vertical native range slider */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="cursor-pointer accent-[#3B7BFB] h-full"
            style={{
              WebkitAppearance: 'slider-vertical', // Standard vertical execution
            //   appearance: 'slider-vertical',
              width: '4px',
            }}
          />
        </div>
      )}

      {/* THE MUTE/UNMUTE BUTTON TRIGGER */}
      <button 
        onClick={toggleMute}
        className="text-white/80 hover:text-[#3B7BFB] p-2 transition-colors duration-200 focus:outline-none"
        aria-label="Volume Control"
      >
        {isMuted || volume === 0 ? (
          // Muted Icon
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="22" y1="9" x2="16" y2="15"></line><line x1="16" y1="9" x2="22" y2="15"></line></svg>
        ) : volume < 0.5 ? (
          // Low Volume Icon
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
        ) : (
          // High Volume Icon
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
        )}
      </button>
    </div>
  )
}

export default VolumeControls