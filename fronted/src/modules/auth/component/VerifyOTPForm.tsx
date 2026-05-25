import React from "react";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d+$/, "Only numbers allowed"),
});

type OtpForm = z.infer<typeof otpSchema>;
function VerifyOTPForm({email}:{email:string}) {
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
    mode: "onChange",
  });

  const otp = watch("otp");

  const handleResend=()=>{

  }

  const trpc=useTRPC()
  const router=useRouter()
  const verifyMutate=useMutation(trpc.user.verifyOTP.mutationOptions({
    onSuccess:()=>{
        toast.success("User Registerd Successfully")
        router.push(`/console/video-library`)
    },
    onError:(err)=>{
        toast.error(err.message || "Something went wrong")
    }

  }))

    const onSubmit = async (data: OtpForm) => {
    console.log("OTP:", data.otp);
    await verifyMutate.mutateAsync({email:email,otp})
    };

  return (

    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col items-centera gap-6 mt-5"
    >
      <InputOTP
        maxLength={6}
        value={otp}
        onChange={(val) =>
          setValue("otp", val, {
            shouldValidate: true,
            shouldDirty: true,
          })
        }
      >
        <InputOTPGroup className="gap-2 sm:gap-2">
          <InputOTPSlot
          
            style={{ borderRadius: "10px" }}
            index={0}
            className="bg-white size-9 md:size-10 rounded-[10px] border border-slate-200 shadow-xs"
          />
          <InputOTPSlot
            style={{ borderRadius: "10px" }}
            index={1}
            className="bg-white size-9 md:size-10 rounded-[10px] border border-slate-200 shadow-xs"
          />
          <InputOTPSlot
            style={{ borderRadius: "10px" }}
            index={2}
            className="bg-white size-9 md:size-10 rounded-[10px] border border-slate-200 shadow-xs"
          />
          <InputOTPSlot
            style={{ borderRadius: "10px" }}
            index={3}
            className="bg-white size-9 md:size-10 rounded-[10px] border border-slate-200 shadow-xs"
          />
          <InputOTPSlot
            style={{ borderRadius: "10px" }}
            index={4}
            className="bg-white size-9 md:size-10 rounded-[10px] border border-slate-200 shadow-xs"
          />
          <InputOTPSlot
            style={{ borderRadius: "10px" }}
            index={5}
            className="bg-white size-9 md:size-10 rounded-[10px] border border-slate-200 shadow-xs"
          />
        </InputOTPGroup>
      </InputOTP>

      <div className="text-sm text-center text-accent font-semibold hover:underline group cursor-pointer">
        Didn't receive a code ? <button onClick={handleResend} className="group-hover:underline cursor-pointer">Resend</button>
      </div>

      <Button className="w-full cursor-pointer tracking-wide mt-0 rounded-md bg-background-btn">
        Continue
      </Button>
    </form>

  );
}

export default VerifyOTPForm;
