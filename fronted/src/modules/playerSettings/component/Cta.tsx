// import React from "react";
// import { ctaType, useSetting } from "./Settings";
// import ItemRow from "./ItemRow";
// import { ImageUp, Info, LayoutTemplate, Upload } from "lucide-react";
// import { Input } from "@/components/ui/input";

// function Cta() {
//   const { playerSettings, setPlayerSettings } = useSetting()!;
//   const handleCtagChange = <K extends keyof ctaType>(
//     key: K,
//     value: ctaType[K],
//   ) => {
//     setPlayerSettings((prev) => ({
//       ...prev,
//       cta: {
//         ...prev.cta,
//         [key]: value,
//       },
//     }));
//   };

//   return (
//     <div className="w-full h-full ">
//       <div className="flex flex-col gap-2 md:gap-2 px-3 pt-2 pb-1">
//         <div className="heading">
//           <h3 className="font-heading font-semibold text-md lg:text-md tracking-wide">
//             Security Setting
//           </h3>
//         </div>

//         <div className="w-full flex flex-col gap-2 md:gap-3">
//           <section className="w-full border-b-[0.5px] border-stone-200">
//             <ItemRow
//               icon={<Info />}
//               checked={playerSettings.cta.ctaEnabled}
//               label={"enable Cta"}
//               description="Enable cta on your video"
//               onChange={(checked) => handleCtagChange("ctaEnabled", checked)}
//             />
//           </section>

//           <section className="w-full border-b-[0.5px] border-stone-200">
//             <div className="w-full grid grid-cols-[40px_1fr_auto] pb-3 gap-3">
//               <div className="flex items-center justify-center">
//                 <div className="bg-stone-100  rounded-md px-2 py-2">
//                   <ImageUp />
//                 </div>
//               </div>
//               <div className=" flex items-scenter justify-center  flex-col space-y-0.5 ">
//                 <h3 className="text-[14px] font-medium text-stone-800 capitalize leading-none">
//                   Cta trigger
//                 </h3>
//                 <p className=" capitalize text-stone-500 text-[13px] leading-relaxed">
//                   When it will be triggering
//                 </p>
//               </div>
//               <div className=" flex items-center justify-center  ">
//                 <label htmlFor="watermark-image">
//                   <div
//                     // role="button"
//                     className="bg-mutedz text-sm text-accent border-black/30 border-[0.5px] text-center rounded-md px-3 h-8 bg-stone-40 gap-2 flex items-center justify-center font-medium animate cursor-pointer"
//                   >
//                     <Upload className="size-4" />
//                     Upload
//                   </div>
//                 </label>
//                 <Input
//                   id="watermark-image"
//                   type="file"
//                   hidden
//                   className="w-36 placeholder:text-black h-8 rounded-md shadow-none"
//                   placeholder="logo url"
//                 />
//               </div>
//             </div>
//           </section>
//           <section className="w-full border-b-[0.5px] border-stone-200">
//             <div className="w-full grid grid-cols-[40px_1fr_auto] pb-3 gap-3">
//               <div className="flex items-center justify-center">
//                 <div className="bg-stone-100  rounded-md px-2 py-2">
//                   <LayoutTemplate />
//                 </div>
//               </div>
//               <div className=" flex items-scenter justify-center  flex-col space-y-0.5 ">
//                 <h3 className="text-[14px] font-medium text-stone-800 capitalize leading-none">
//                   Watermark Text Type
//                 </h3>
//                 <p className=" capitalize text-stone-500 text-[13px] leading-relaxed">
//                   watermark text on the video
//                 </p>
//               </div>
//             </div>
//           </section>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Cta;
