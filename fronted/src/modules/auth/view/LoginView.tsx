"use client"
import { Login } from '@hugeicons/core-free-icons'
import Image from 'next/image'
import React from 'react'
import LoginForm from '../component/LoginForm'
import { Button } from '@/components/ui/button'
import { useMutation } from '@tanstack/react-query'
import { useTRPC } from '@/trpc/client'

function LoginView() {
    const trpc=useTRPC()
    const googleSignIn = useMutation(trpc.user.googleSignIn.mutationOptions(
   
  ));
  
  const handleGoogleSignIn = () => {
  googleSignIn.mutate(undefined, {
    onSuccess: (data) => {
      console.log("Redirecting to Google OAuth:", data.url);
      window.location.href = data.url; 
    },
    onError: (err:any) => {
      console.error("Error from tRPC:", err);
    },
  });
};
console.log("test")
  return (
    <div className='w-full  min-h-screen flex flex-col'>
        <div className='flex flex-1 w-full h-full items-center justify-center'>
            <div className='flex gap-1  flex-col items-center justify-center'>
                <h2 className='text-xl md:text-3xl font-medium leading-relaxed tracking-wider font-heading'>Welcome back 👏  </h2>

                <div className='w-full mt-2'>
                    <Button variant={"outline"} className='w-full shadow-xs rounded-sm capitalize flex bg-transparent leading cursor-pointer hover:text-accent hover:bg-black/2 text-accent items-center gap-3' onClick={handleGoogleSignIn}>
                        <Image src={"/intigration/google.png"} alt='google' width={15} height={15}/>
                        Continue with google
                    </Button>
                </div>

                <div className='inline-flex items-center justify-center relative w-full mt-5'>

                    <p className="text-accent text-sm relative flex items-center w-full gap-2 after:content-[''] after:w-full after:border-b after:border-[#eee] after:translate-y-[2px] before:content-[''] before:w-full before:border-b before:border-[#eee] before:translate-y-[2px]">
                    or
                    </p>
                </div>
                <LoginForm/>
            </div>
        </div>
    </div>
  )
}

export default LoginView