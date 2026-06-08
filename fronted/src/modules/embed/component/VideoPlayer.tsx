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
import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';


function VideoPlayer({videoId}:{videoId:string}) {
  const trpc=useTRPC()
    const { data, error, isLoading } = useSuspenseQuery(
    trpc.video.getVideo.queryOptions({ videoId })
  )


  



    const customThemeStyles = {
    width: '100%',
    height: '100%',
    '--media-primary-color': "white",
    '--media-icon-hover-color': "black",
    '--media-range-bar-color': "white",
    '--media-control-background': 'rgba(15, 23, 42, 0.8)',
    '--media-control-hover-background': 'rgba(30, 41, 59, 0.95)',
    backdropFilter: 'blur(8px)'
  };

  return (
   <MediaController style={customThemeStyles} autoFocus className='w-full min-h-screen'>
      <video
        // ref={videoRef}
        src={"https://pub-8a5942cb01e54d70af415184ac8ed7b9.r2.dev/uploads/117d76fe-8d16-417e-b7dd-bf28fff6f040-socio-home.mp4"}
        slot="media"
        // crossOrigin="anonymous"
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