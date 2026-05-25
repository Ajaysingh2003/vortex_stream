"use client";
import { Edit, Edit2Icon } from "lucide-react";
import React from "react";
import VerifyOTPForm from "../component/VerifyOTPForm";

function VerifyOTPView({email}:{email:string}) {
  return (
    <div className="flex items-center flex-col justify-center w-full h-full min-h-screen">
      <div className="max-w-sm flex items-center gap-1 justify-center flex-col">
        <h2 className="text-xl text-black font-heading tracking-wide font-semibold">
          Verify Your Email
        </h2>
        <div className="inline-flex items-center justify-center">
            <p className="text-center text-accent text-sm tracking-wide">
          Enter the verification code sent to your email <br/>
         <span className="email">ajaysingh131629@gmail.com</span> <span className=" inline-block">
            <Edit className="size-3 font-bold text-black"/>
        </span>
        </p>
        
        </div>
        <VerifyOTPForm email={email ?? ""}/>
      </div>
    </div>
  );
}

export default VerifyOTPView;
