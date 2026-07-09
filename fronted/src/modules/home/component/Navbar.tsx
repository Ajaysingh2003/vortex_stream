// import { Button } from '@/components/ui/button'
// import Image from 'next/image'
// import React from 'react'

// function Navbar() {
//   return (
//     <div className='max-w-4xl  mt-4 bg-black/2   w-full     pl-5 pr-2 py-1.5 bg-ag-gray-50/90 shadow-[0_1px_1px_0_rgba(38,38,43,0.10),0_0_0_1px_rgba(38,38,43,0.04),0_2px_12px_-4px_rgba(38,38,43,0.16)] backdrop-blur-sm rounded-md '>

//         <div className='w-full flex justify-between '>
//             <div className='flex items-center justify-between gap-4'>
//                 <div className='logo  rounded-full  overflow-hidden'>
//                     <Image height={100} className='size-6' width={100} src={"/intigration/dropbox.png"} alt='logo'/>
//                 </div>
//                 <div className='items hidden md:flex items-center justify-center'>
//                     <ul className=''>

//                     </ul>
//                 </div>
//             </div>

//             <div className='btns'>
//                 <Button variant={"secondary"} className=' bg-transparent'>Sign in</Button>
//                 <Button  className=''>Login</Button>
//             </div>
//         </div>

//     </div>
//   )
// }

// export default Navbar


import Image from 'next/image'
import React from 'react'

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Button } from '@/components/ui/button'

function Navbar() {
  return (
    <header className='pl-5 w-full  mt-3 lg:mt-5 pr-2 py- bg-[#f9f9f9] bg-ag-gray-50/90 shadow-[0_1px_1px_0_rgba(38,38,43,0.10),0_0_0_1px_rgba(38,38,43,0.04),0_2px_12px_-4px_rgba(38,38,43,0.16)] backdrop-blur-sm rounded-lg max-w-[80%] md:max-w-4xl mx-auto'>
      <nav className=' flex items-center gap-3 py-1.5 justify-between'>
        <div className='slide_1 flex items-center gap-3'>

          <div className='relative max-w-8 rounded-full overflow-hidden'>
          <Image src={"/intigration/dropbox.png"} alt='logo' height={100} width={100} />

        </div>
          <div className='hidden md:flex items-center gap-2'>
          
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className='rounded-lg'>Strategies</NavigationMenuTrigger>
                  <NavigationMenuContent  className='min-w-3xl mx-auto rounded-md'>
                    <NavigationMenuLink>Link</NavigationMenuLink>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Research</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <NavigationMenuLink>Link</NavigationMenuLink>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Backtest</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <NavigationMenuLink>Link</NavigationMenuLink>
                  </NavigationMenuContent>
                </NavigationMenuItem>

               <NavigationMenuItem>
                  <NavigationMenuTrigger>Pricing</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <NavigationMenuLink>Link</NavigationMenuLink>
                  </NavigationMenuContent>
                </NavigationMenuItem>


              </NavigationMenuList>
            </NavigationMenu>

          </div>
        </div>

            <div className='md:hidden  items-center justify-center'>
sa
            </div>
        <div className='side_2 hidden md:flex items-center gap-2'>
          <Button className=' capitalize  cursor-pointer' variant={"ghost"}>Sign in</Button>
          <Button className='capitalize rounded-md bg-main-btn font-bold  cursor-pointer text-white px-3'>Get Started</Button>
        </div>
      </nav>  
    </header>
  )
}

export default Navbar