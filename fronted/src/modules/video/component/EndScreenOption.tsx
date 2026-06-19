import React from 'react'
import { useVideoContext } from '../context/VideoContext';
import CallToAction from './CallToAction';

function EndScreenOption() {
  const { endScreen } = useVideoContext()!;
    
  switch (endScreen) {
    case "call_to_action":
      return (
        <CallToAction/>
      );
    
    case "more_video":
      return <div>More Videos Component</div>;

    case "custom_image":
      return <div>Custom Image Component</div>;

    case "share_button":
      return <div>Share Button Component</div>;

    case "custom_message":
      return <div>Custom Message Component</div>;

    case "empty":
    default:
      return null; // React expects null or an element if you want to render nothing
  }
}

export default EndScreenOption;