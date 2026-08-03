import React from 'react'
import ThumbnailUpdate from './ThumbnailUpdate';
import Form from './Form';
import EndScrennControl from './EndScrennControl';
import SubtitleControl from './SubtitleControl';
import Chapters from './Chapters';
import CtaSetting from './CtaSetting';

interface VideoSettingTypeProps {
  type: "general" | "thumbnail" | "controls" | "analytics" | string; // Type-safety strings
}

function VideoSettingType({ type }: VideoSettingTypeProps) {
  
  let settingContent: React.ReactNode;

  switch (type) {
    case 'form':
      settingContent = <Form/>
      break;
    case 'thumbnail':
      settingContent = <ThumbnailUpdate/>
      break;
    case 'end_screen':
      settingContent =  <EndScrennControl/>
      break;
    case 'analytics':
      settingContent = <div>Video Performance Metrics and Data Charts</div>;
      break;
    case 'subtitle':
      settingContent = <SubtitleControl/>;
      break;
      
    case 'chapter':
      settingContent = <Chapters/>;
      break;
    case 'cta':
      settingContent = <CtaSetting/>;
      break;

    default:
      settingContent = <div>Select a valid setting configuration panel</div>;
  }

  return (
    <div className='w-full h-full'>
        {settingContent}
    </div>
  )
}

export default VideoSettingType;