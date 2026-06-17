import React from 'react'
import ThumbnailUpdate from './ThumbnailUpdate';
import Form from './Form';

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
    case 'controls':
      settingContent = <div>Manage Player Controls and UI Overlays</div>;
      break;
    case 'analytics':
      settingContent = <div>Video Performance Metrics and Data Charts</div>;
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