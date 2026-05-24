import React from "react";

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"

import {z} from "zod"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/dist/client/link";
import { Eye, EyeClosed, EyeOff } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
function RegisterForm() {

    const trpc=useTRPC()

    const mutate=useMutation(trpc.user.register.mutationOptions({
        onSuccess:()=>{
            toast.success("Registered successfully")
        },
        onError:(err)=>{
            toast.error( err.message || "Failed to register")
        }
    }))

    const [showPassword, setShowPassword] = React.useState(false);

    const schema=z.object({
        name:z.string().min(2).max(100),
        email:z.string().email(),
        password:z.string().min(6)
    })
    const form=useForm({
        resolver:zodResolver(schema),
        defaultValues:{
            name:"",
            email:"",
            password:""
        }
    })

    const [showPasswordField,setShowPasswordField]=React.useState(false)

    const emailValue=form.watch("email")
    const nameValue=form.watch("name")

    const handleContinue = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const nameVal=schema.shape.name.safeParse(nameValue).success
    
    if  (!nameVal) {
        form.setError("name", {
            type: "invalid",
            message: "Name must be between 2 and 100 characters",
        });
        return;
    }
    if (!nameValue) {
        form.setError("name", {
            type: "required",
            message: "Name is required",
        });
        return;
    }

        if (!emailValue) {
        form.setError("email", {
            type: "required",
            message: "Email is required",
        });
        return;
    }

    const isValidEmail=schema.shape.email.safeParse(emailValue).success

    if (!isValidEmail) {
        form.setError("email", {
            type: "invalid",
            message: "Please enter a valid email address",
        });
        return;
    }
    

    form.clearErrors("email");

    setShowPasswordField(true);
};



const handleSubmit= (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    form.handleSubmit(async(data) => {
        console.log("Form submitted with data:", data);
        await mutate.mutateAsync(data);
    })();
}



  return (
    <div className="w-82">
      <div className="w-full">
        <form onSubmit={handleSubmit} className="w-full">
            <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-name">
                    Name
                  </FieldLabel>
                  <Input
                    {...field}
                    className="rounded-sm bg-transparent text-accent font-medium"
                    id="form-rhf-demo-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter your name"
                    autoComplete="on"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            
                <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-rhf-demo-email">
                        Email Address
                    </FieldLabel>
                    <Input
                        {...field}
                        className="rounded-sm bg-transparent text-accent font-medium"
                        id="form-rhf-demo-email"
                        aria-invalid={fieldState.invalid}
                        placeholder="Enter your email address"
                        autoComplete="on"
                    />
                    {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                    )}
                    </Field>
                )}
                />
            { showPasswordField && <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-password">
                    Password
                  </FieldLabel>
                  <div className=" relative w-full h-full">
                    <div className=" absolute right-3">
                        <Button variant="ghost" size="icon" onClick={(e) => {
                            e.preventDefault();
                            setShowPassword((prev) => !prev)
                        }}>
                            {!showPassword ? <Eye/> : <EyeOff/>}
                        </Button>
                    </div>
                    <Input
                    {...field}
                    type={showPassword ? "text" : "password"}
                    className="rounded-sm bg-transparent text-accent font-medium"
                    aria-invalid={fieldState.invalid}
                    placeholder="••••••••"
                    autoComplete="off"
                  />

                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />}
                  
         
        </FieldGroup>

        { !showPasswordField && <Button onClick={handleContinue} className="w-full cursor-pointer tracking-wide mt-5 rounded-md bg-background-btn">Continue</Button>
        }
        { showPasswordField && <Button disabled={mutate.isPending} className="w-full cursor-pointer tracking-wide mt-5 rounded-md bg-background-btn">
            {mutate.isPending ? "Registering..." : "Register"}
        </Button>
        }
        
        </form>
        <div className="flex items-center justify-center mt-3">
              <h3 className="text-[14px] text-stone-500 font-medium">Don't have an account? <Link className="font-semibold hover:underline duration-300 ease-in-out transition-all leading-relaxed text-accent" href="/login">Sign In</Link></h3>
        </div>
      </div>
    </div>
  );
}

export default RegisterForm;
