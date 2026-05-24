"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function SignInAdmin() {
  const trpc = useTRPC();
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const mutate = useMutation(
    trpc.user.login.mutationOptions({
      onSuccess: () => {
        toast.success("Admin login successful");
        router.push("/console");
      },
      onError: (err) => {
        const message =
        // (err?.data as any)?.message ||
        err?.message ||
        "Something went wrong";
        console.log(message,"oll");
        toast.error(message);
      },
    })
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await mutate.mutateAsync({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
    } catch (err) {
      console.error("Login failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">

      <Button onClick={handleGoogleSignIn} className=" cursor-pointer outline-0 w-full focus:oultine-0 btn-main px-2 py-1 text-xs tracking-wide">
             
              Continue with Google
            </Button>
      <div className="w-full max-w-md space-y-6 p-8 bg-white rounded-2xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Login
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Secure Email & Password Login
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="space-y-3">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="Enter email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* Password */}
          <div className="space-y-3">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verifying..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}