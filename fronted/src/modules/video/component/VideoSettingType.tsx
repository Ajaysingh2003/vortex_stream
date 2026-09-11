import React from 'react'
import ThumbnailUpdate from './ThumbnailUpdate';
import Form from './Form';
import EndScrennControl from './EndScrennControl';
import SubtitleControl from './SubtitleControl';
import Chapters from './Chapters';
import CtaSetting from './CtaSetting';
import DomainRestriction from './DomainRestriction';

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
      
    case 'domain_restriction':
      settingContent = <DomainRestriction/>;
      break;

    case 'cta':
      settingContent = <CtaSetting/>;
      break;

    default:
      settingContent = (
        <div className="flex flex-col items-center justify-center text-center p-6 space-y-2">
          <p className="font-heading text-sm font-semibold text-foreground">
            Configuration Panel
          </p>
          <p className="font-subheading text-xs text-muted-foreground">
            Select a setting option from the sidebar to manage this video.
          </p>
        </div>
      );
  }

  return (
    <div className="w-full h-full flex flex-col justify-center">
      {settingContent}
    </div>
  );
}

export default VideoSettingType;