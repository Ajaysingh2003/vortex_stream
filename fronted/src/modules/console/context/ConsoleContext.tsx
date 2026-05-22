import { UploadItem } from "@/modules/types";
import { createContext, useContext, useState } from "react";



interface PlayerContextType {
  openCreateFolder: boolean;
  setOpenCreateFolder: (e:boolean) => void;
  items: UploadItem[];
  setItems: React.Dispatch<React.SetStateAction<UploadItem[]>>;
}

const consoleContext=createContext<PlayerContextType | null>(null)


export const ConsoleProvider=({children}:{children:React.ReactNode})=>{

    const [openCreateFolder,setOpenCreateFolder]=useState(false)
    const [items, setItems] = useState<UploadItem[]>([]);
    
    return <consoleContext.Provider value={{openCreateFolder,setOpenCreateFolder, items, setItems}} >
        {children}
    </consoleContext.Provider>
}

export const useConsoleContext=()=>{
    const context=useContext(consoleContext)

    return context
}