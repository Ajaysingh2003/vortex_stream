import { renameType, UploadItem } from "@/modules/types";
import { createContext, useContext, useState } from "react";



interface PlayerContextType {
  openCreateFolder: boolean;
  setOpenCreateFolder: (e:boolean) => void;
  items: UploadItem[];
  rename: renameType | null;
  setItems: React.Dispatch<React.SetStateAction<UploadItem[]>>;
  setRename: React.Dispatch<React.SetStateAction<renameType | null>>;
}

const consoleContext=createContext<PlayerContextType | null>(null)


export const ConsoleProvider=({children}:{children:React.ReactNode})=>{
    
    const [openCreateFolder,setOpenCreateFolder]=useState(false)
    const [items, setItems] = useState<UploadItem[]>([]);
    const [rename,setRename]=useState<renameType | null>(null)
    return <consoleContext.Provider value={{openCreateFolder,setOpenCreateFolder, items, setItems,rename,setRename}} >
        {children}
    </consoleContext.Provider>
}

export const useConsoleContext=()=>{
    const context=useContext(consoleContext)

    return context
}