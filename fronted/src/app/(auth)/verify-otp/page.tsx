import VerifyOTPView from '@/modules/auth/view/VerifyOTPView'
import React from 'react'

type PageProps = {
  searchParams: {
    email?:string;
  };
};


async function page({searchParams}:PageProps) {

    const {email } =await searchParams;

  return (
    <div className='w-full h-full'>
        <VerifyOTPView email={email ?? ""} />
    </div>
  )
}

export default page