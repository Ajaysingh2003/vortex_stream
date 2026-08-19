"use client";

import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTRPC } from "@/trpc/client";

export default function ChannelCreateDialog({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const create = useMutation(
    trpc.channel.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.channel.list.queryKey(),
        });
        setName("");
        setOpen(false);
        toast.success("Channel created");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full px-4 shadow-sm">
          <Plus /> Create channel
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            Create a channel
          </DialogTitle>
          <DialogDescription>
            Give your collection a clear name. You can add and arrange videos
            next.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label htmlFor="channel-name" className="text-sm font-medium">
            Channel name
          </label>
          <Input
            id="channel-name"
            autoFocus
            maxLength={255}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && name.trim())
                create.mutate({ workspaceId, name: name.trim() });
            }}
            placeholder="e.g. Product walkthroughs"
            className="h-10 rounded-md"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            className="bg-main-btn"
            disabled={!name.trim() || create.isPending}
            onClick={() => create.mutate({ workspaceId, name: name.trim() })}
          >
            {create.isPending ? "Creating…" : "Create channel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
