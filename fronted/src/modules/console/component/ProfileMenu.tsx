import React, { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import GenerateAvartar from "./generateAvatar";
import {
  Check,
  ChevronDown,
  ChevronUp,
  LogOutIcon,
  LucideLogOut,
  Plus,
  Settings,
  Settings2Icon,
  SettingsIcon,
} from "lucide-react";
import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

interface ProfileType {
  email: string;
  role: string;
  isActive: boolean;
}

interface workspacesType {
  id: string;
  name: string;
  isDefault: boolean;
}

interface WorkspaceType {
  name: string;
  id: string;
}

function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const trpc = useTRPC();
  const { data: profile } = useSuspenseQuery(trpc.user.profile.queryOptions());
  const { data: workspaces } = useSuspenseQuery(
    trpc.user.getWorkspaces.queryOptions(),
  );
  const profileData = profile as ProfileType;
  const workspacesData = workspaces as workspacesType[];
  console.log(workspaces, "leah jaye");
  const [workspaceName, setWorkspaceName] = useState<string>("");
  // const router=useRouter()
  const switchWorkspace = useMutation(
    trpc.user.switchWorkspace.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.user.getWorkspace.queryOptions(),
        );
        // router.refresh()
        await queryClient.invalidateQueries(
          trpc.user.getWorkspaces.queryOptions(),
        );
      },
    }),
  );

  const { data } = useSuspenseQuery(trpc.user.getWorkspace.queryOptions());

  const activeWorkspace = data as WorkspaceType;

  const queryClient = useQueryClient();
  const mutate = useMutation(
    trpc.user.createWorkspace.mutationOptions({
      onSuccess: () => {
        toast.success("Workspace Created.");
        queryClient.invalidateQueries(trpc.user.getWorkspace.queryOptions());
        setOpenDialog(false);
        setOpen(false);
      },
      onError: (err) => {
        console.log(err, "lollol");
        toast.error(err.message);
      },
    }),
  );

  const handleSubmit = async () => {
    if (!workspaceName.trim()) {
      toast.error("Workspace Created.");
      return;
    }
    await mutate.mutateAsync({ name: workspaceName });
  };

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const activeWorkspaceId = searchParams.get("workspaceId");

  const addSearchParams = async (id: string) => {
    await switchWorkspace.mutateAsync({ workspaceId: id });
  };

  // const activeWorkspace=workspacesData.find((e)=>e.id==activeWorkspaceId ||e.isDefault==true)

  const [hoverWorkspace, setHoverWorkspace] = useState<string>("");

  const handleOnTouch = (id: string) => {
    // if(!id.trim()) return
    console.log(id, "from test case 1");
    setHoverWorkspace(id);
  };
  return (
    <DropdownMenu open={open} onOpenChange={(e) => setOpen(e)}>
      <DropdownMenuTrigger className=" cursor-pointer hover:bg-black/5" asChild>
        <button
          className="
          py-2 rounded-lg
          text-black
          w-full h-full px-2 gap-2 text-xs flex items-center
          shadow-none
          focus:outline-none
          focus:ring-0
          focus-visible:outline-none
          focus-visible:ring-0
          focus-visible:ring-offset-0
          "
        >
          <GenerateAvartar
            isCircle={false}
            className=" rounded-2xl shrink-0"
            seed={profileData.email}
            variant="initials"
          />
          <div className="flex flex-col gap-[2px]">
            <h3 className="truncate flex-1 max-w-[120px] font-semibold text-[14px]">
              {profileData.email}
            </h3>
            <p className="text-left tracking-wide text-stone-500 line-clamp-1">
              {activeWorkspace?.name}
            </p>
          </div>
          <div
            className={`transition-transform duration-150 ${
              open ? "rotate-180" : "rotate-0"
            }`}
          >
            <ChevronDown className="size-4" />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-52 bg-white focus-visible:outline-none border-none outline-none text-stone-400"
        align="start"
      >
        <div className="w-full px-2 py-2">
          <div className="flex flex-col w-full gap-2">
            <div className=" flex gap-3 items-center ">
              <div className="relative">
                <GenerateAvartar
                  isCircle={false}
                  className=" rounded-2xl size-8"
                  seed={profileData.email}
                  variant="initials"
                />
              </div>
              <div className="">
                <p className=" m-0  flex flex-col">
                  <span className="text-email text-[12px] truncate max-w-[100px] font-subheading font-semibold text-black">
                    {profileData.email}
                  </span>
                  <span className="text-[12px]">Free</span>
                </p>
              </div>
            </div>

            <div className=" grid grid-cols-2 gap-2 mt-2  text-xs w-full">
              <DropdownMenuItem className="text-black/70 cursor-pointer bg-black/5 text-[11px] w-full menu-btn ">
                <Settings className="size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="text-black/70 bg-black/5 text-[11px] menu-btn">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
                Invite
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="bg-black/20" />
            <p className="text-[11px] text-black/40 pl-1 line-clamp-1">
              {profileData.email}
            </p>

            <div className="flex flex-col gap-1">
              {workspacesData.map((e) => (
                <DropdownMenuItem
                  onPointerEnter={() => handleOnTouch(e.id)}
                  onPointerLeave={() => setHoverWorkspace("")}
                  key={e.id}
                  onClick={() => addSearchParams(e.id)}
                  className="text-[12px] cursor-pointer py-1.5 grid grid-cols-[30px_1fr_20px]"
                >
                  <GenerateAvartar
                    isCircle={true}
                    className=" rounded-[10px] size-5"
                    seed={profileData.email}
                    variant="initials"
                  />

                  <span className=" truncate max-w-[100px] text-black/90 font-medium  tracking-wide text-[12px] capitalize">
                    {e.name}
                  </span>

                  <div>
                    {hoverWorkspace == e.id && e.id === activeWorkspace.id && (
                      <SettingsIcon className="size-3.5 text-stone-500 transition-all duration-150 ease-in-out" />
                    )}

                    {e.id == activeWorkspace.id && e.id !=hoverWorkspace && (
                      <Check className="text-stone-500 transition-all duration-150 ease-in-out" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}

              <Dialog open={openDialog} onOpenChange={(e) => setOpenDialog(e)}>
                <DialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-[12px] py-1 px-2 grid grid-cols-[32px_1fr] gap-1 cursor-pointer hover:bg-black/5 transition-colors focus:bg-black/5"
                  >
                    <div className="flex items-center justify-center size-7 rounded-md border border-black/10 bg-white/70">
                      <Plus
                        className="size-3.5 text-black/70"
                        strokeWidth={3}
                      />
                    </div>

                    <div className="flex flex-col justify-center ml-1">
                      <span className="truncate max-w-[150px] text-black/90 font-semibold tracking-tight text-[12px]">
                        Create Workspace
                      </span>
                    </div>
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent className="lg:w-84 rounded-xl">
                  <DialogHeader>
                    <DialogTitle>Create Workspace</DialogTitle>
                  </DialogHeader>
                  <section>
                    <Input
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      placeholder="Workspace name"
                      className="rounded-lg border-none outline-none shadow-none ring-0  focus-within:ring-violet-300 focus-within:shadow-none"
                    />
                  </section>
                  <DialogFooter className="w-full">
                    <div className="grid grid-cols-2 gap-5 items-center  w-full justify-center">
                      <Button
                        onClick={() => setOpenDialog(false)}
                        className="w-full rounded-lg text-black hover:bg-black/5 cursor-pointer bg-black/10 "
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={mutate.isPending || !workspaceName.trim()}
                        className="w-full cursor-pointer rounded-lg text-white bg-violet-400 hover:bg-violet-300"
                      >
                        Create
                      </Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <DropdownMenuItem className="text-[12px] py-1 px-2 grid grid-cols-[32px_1fr] gap-2 cursor-pointer hover:bg-black/5 transition-colors focus:bg-black/5">
                <div className="flex items-center justify-center size-7 rounded-md border border-black/10 bg-white/70">
                  <LucideLogOut
                    className="size-3.5 text-black/70"
                    strokeWidth={3}
                  />
                </div>

                <span className="truncate max-w-[150px] text-black/90 font-semibold tracking-tight text-[12px]">
                  Logout
                </span>
              </DropdownMenuItem>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ProfileMenu;
