import { Button } from '@/components/ui/button';
import { Bolt, FilePenLine, Settings2, ShieldEllipsis, Subtitles, Zap } from 'lucide-react';
import React, { createContext, useContext, useState } from 'react';
import SettingsContent from './SettingsContent';

interface PlayerContextType {
  selectedOption: string;
  setSelectOption: (e:string) => void;
}

const settingContext=createContext<PlayerContextType | null>(null)

export function Settings({children}:{children:React.ReactNode}){

    const [selectedOption,setSelectOption]=useState<string>("general")

    return <settingContext.Provider value={{selectedOption,setSelectOption}}>
        <section className='setting-control h-full   grid grid-cols-1 gap-2 md:gap-4 lg:gap-8 md:grid-cols-6'>{children}</section>
    </settingContext.Provider>


}

const Menu=()=>{

    const menuContext=useContext(settingContext)

    const items=[
        {
            label:"general",
            icon:<Zap className='size-4'/>
        },
        {
            label:"controls",
            icon:<Bolt className='size-4'/>
        },
        {
            label:"customization",
            icon:<FilePenLine className='size-4'/>
        },
        {
            label:"subtitle",
            icon:<Subtitles className='size-4'/>
        },
        {
            label:"security",
            icon:<ShieldEllipsis className='size-4'/>
        },
        {
            label:"advanced",
            icon:<Settings2 className='size-4'/>
        },
    ]

    const isActive=(label:string)=>label==menuContext?.selectedOption;

    const handleChange=(label:string)=>menuContext?.setSelectOption(label)

    return <div className='w-full col-span-2'>
        <div className='flex flex-row md:flex-col  flex-1'>
            {
            items.map((e)=>(
                <div>
                    <Button onClick={()=>handleChange(e.label)} variant={"outline"} className={`w-full rounded-lg ${isActive(e.label)?"bg-[#c2adf242] text-violet-500":"bg-transparent"} px-2 py-2 md:py-6 border-none outline-none font-medium tracking-wide flex font-heading hover:bg-[#bca3f612] hover:text-violet-500 justify-start md:px-4 gap-2 md:gap-6 cursor-pointer`}>
                        {e.icon}
                        <span className=' capitalize text-sm md:text-md '>{e.label}</span>
                    </Button>
                </div>
            ))
        }
        </div>
    </div>
    
}

const Content=()=>{
    const context=useContext(settingContext)
    return <div className='col-span-4 w-full min-h-full border-[0.0001px] border-[#000000b0] rounded-xl'>
        <SettingsContent activeOption={context?.selectedOption}/>
    </div>
}

Settings.Menu=Menu
Settings.Content=Content