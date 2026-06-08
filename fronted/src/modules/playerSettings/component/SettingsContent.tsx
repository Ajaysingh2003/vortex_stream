import React from 'react'
import GeneralSetting from './GeneralSetting'
import ControlsSettings from './ControlsSettings'
import Branding from './Branding'
// import SubTitle from './SubTitle'
import Security from './Security'
import Advance from './Advance'
// import Cta from './Cta'

function SettingsContent({activeOption}:{activeOption:string | undefined}) {

    
    

  switch (activeOption){
    case 'general':
        return <GeneralSetting/>
    case 'controls':
        return <ControlsSettings/>
    case 'branding':
        return <Branding/>
    case 'security':
        return <Security/>
    // case 'cta':
    //     return <Cta/>
  }
}

export default SettingsContent