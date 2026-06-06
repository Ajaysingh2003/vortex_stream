import React from 'react'

import {
  MediaController,
  MediaControlBar,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaVolumeRange,
  MediaPlayButton,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaMuteButton,
  MediaPipButton,
  MediaPlaybackRateButton,
  MediaFullscreenButton,
  MediaLoadingIndicator,
} from 'media-chrome/react';


function VideoPlayer() {

    const customThemeStyles = {
    width: '100%',
    height: '100%',
    '--media-primary-color': "red",
    '--media-icon-hover-color': "red",
    '--media-range-bar-color': "red",
    '--media-control-background': 'rgba(15, 23, 42, 0.8)',
    '--media-control-hover-background': 'rgba(30, 41, 59, 0.95)',
    backdropFilter: 'blur(8px)'
  };

  return (
   <MediaController style={customThemeStyles} autoFocus>
      <video
        // ref={videoRef}
        src={"https://gumlet.tv/watch/6a232292bc82cd6f1a8ed287/"}
        slot="media"
        crossOrigin="anonymous"
        playsInline
        muted={true} // Must be muted for automatic activation mechanics
      />

      {/* Centered Loading Indicator component */}
      <MediaLoadingIndicator slot="centered-chrome" style={{ transform: 'scale(1.5)' }} />

      {/* Custom UI Layout Control Bar */}
      <MediaControlBar>
        <MediaPlayButton />
        <MediaSeekBackwardButton seekOffset={10} />
        <MediaSeekForwardButton seekOffset={10} />
        
        <MediaMuteButton />
        <MediaVolumeRange />
        
        <MediaTimeDisplay showDuration />
        <MediaTimeRange />
        
        <MediaPlaybackRateButton />
        {true && <MediaPipButton />}
        <MediaFullscreenButton />
      </MediaControlBar>
    </MediaController>
  )
}

export default VideoPlayer