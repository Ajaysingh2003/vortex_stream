import React from 'react'
import { useVideoContext } from '../context/VideoContext';
import CallToAction from './CallToAction';
import ShareButton from './ShareButton';
import CustomImage from './CustomImage';
import CustomMessage from './CustomMessage';
import { EmptyContent } from '@/components/ui/empty';
import EmptyState from './Empty';
import MoreVideo from './MoreVideo';

function EndScreenOption() {
  const { endScreen } = useVideoContext()!;
    
  switch (endScreen) {
    case "call_to_action":
      return (
        <CallToAction/>
      );
     
    case "more_video":
      return <MoreVideo/>

    case "custom_image":
      return <CustomImage/>

    case "share_button":
      return <ShareButton/>

    case "custom_message":
      return <CustomMessage/>

    case "empty":
      return <EmptyState/>
    default:
      return null;
  }
}

export default EndScreenOption;