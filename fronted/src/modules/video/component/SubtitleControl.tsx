import { Button } from "@/components/ui/button";
import { VideoSubtitle, WorkspaceType } from "@/modules/types";
import { useTRPC } from "@/trpc/client";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { AppWindow, Plus, X, Globe, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import React, { ChangeEvent, useRef, useState } from "react";
import toast from "react-hot-toast";

interface SubtitleFile {
  id: string;
  fileName: string;
  file: File | null;
  language: string;
  languageLabel: string;
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "ru", label: "Russian" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
  { code: "ar", label: "Arabic" },
  { code: "hi", label: "Hindi" },
  { code: "bn", label: "Bengali" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "mr", label: "Marathi" },
  { code: "ur", label: "Urdu" },
  { code: "gu", label: "Gujarati" },
  { code: "kn", label: "Kannada" },
  { code: "ml", label: "Malayalam" },
  { code: "pa", label: "Punjabi" },
  { code: "other", label: "Other" },
];

function SubtitleControl() {
  const params = useParams();

  const videoId = params?.id as string;

  const trpc = useTRPC();

  const workspace = useSuspenseQuery(trpc.user.getWorkspace.queryOptions());
  const workspacedata = workspace.data as WorkspaceType;

  const subtitle=useSuspenseQuery(trpc.video.getSubtitle.queryOptions({video_id:videoId,workspaceID:workspacedata.id}))
 
  
  const subtitleData=subtitle.data as VideoSubtitle[]


  // console.log(subtitleData);



  
  const isPremium = true;


  const defaultData: SubtitleFile[] = subtitleData.map((e) => {
  return {
    id: e.id || "",
    fileName: e.file_name, 
    file: null,            
    language: e.code,      
    languageLabel: e.label
  };
});

  const [subtitles, setSubtitles] = useState<SubtitleFile[]>(
    
    
    defaultData.length!=0 ? defaultData :[
    {
      id: crypto.randomUUID(),
      fileName: "Select Your Subtitle file",
      file: null,
      language: "en",
      languageLabel: "",
    },
  ]);

  const handleFileChange = (
    id: string,
    file: File | null,
    fileName: string,
  ) => {
    setSubtitles((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, file, fileName } : sub)),
    );
  };

  const handleLanguageChange = (
    id: string,
    language: string,
    languageLabel: string,
  ) => {
    setSubtitles((prev) =>
      prev.map((sub) =>
        sub.id === id ? { ...sub, language, languageLabel } : sub,
      ),
    );
  };

  const handleAddSubtitle = () => {
    if (!isPremium && subtitles.length == 1) {
      toast.error("Update to Premium for more subtitls");
      return;
    }
    setSubtitles((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        fileName: "Select Your Subtitle file",
        file: null,
        language: "en",
        languageLabel: "",
      },
    ]);
  };

  const handleRemoveSubtitle = (id: string) => {
    setSubtitles((prev) => prev.filter((sub) => sub.id !== id));
  };

  const uploadMutate = useMutation(trpc.upload.getSignedUrl.mutationOptions());

  const upsertVideoSubtitleSave = useMutation(
    trpc.video.VideoSubtitle.mutationOptions({
      onError: (err) => {
        toast.error(err.message);
      },
      onSuccess: () => {
        toast.success("Video Subtitle Saved Successfully");
      },
    }),
  );

  const findDuplicateCodes = (): string[] => {
    const codes = subtitles.map((e) => e.language);

    // Filter items where the first index found doesn't match the current index
    return codes.filter((code, index) => codes.indexOf(code) !== index);
  };

  // Example Usage:
  const duplicates = findDuplicateCodes();
  if (duplicates.length > 0) {
    console.log(
      `Error: The following languages are selected multiple times: ${duplicates.join(", ")}`,
    );
  }
  const handleSubmit = async () => {
    // 1. Filter and capture the base array rows holding real file pointers
    const validRows = subtitles.filter((sub) => sub.file !== null);

    const duplicates = findDuplicateCodes(); // e.g., ['en']
    if (duplicates.length > 0) {
      toast.error(
        `Error: The following languages are selected multiple times: ${duplicates.join(", ")}`,
      );
      return;
    }
    // if (validRows.length === 0) {
    //   toast.error("Please select at least one subtitle file to upload.");
    //   return;
    // }

    // 2. Map payload items strictly formatted for your upload metadata signer endpoint
    const payloadItems = validRows.map((e) => ({
      name: e.file!.name,
      type: e.file!.type,
      size: e.file!.size,
    }));

    const uploadToastId = toast.loading("Preparing secure storage nodes...");

    try {
      const uploadResponse = await uploadMutate.mutateAsync(payloadItems);

      if (
        !uploadResponse?.files ||
        uploadResponse.files.length !== validRows.length
      ) {
        throw new Error("Invalid storage allocation response array length.");
      }

      toast.loading("Streaming subtitle binaries to object storage...", {
        id: uploadToastId,
      });

      // 4. Upload all binary files concurrently straight to Cloudflare R2
      const finalizedItems = await Promise.all(
        validRows.map(async (row, index) => {
          const r2Ticket = uploadResponse.files[index];
          const fileBinary = row.file!;

          // Perform raw binary stream payload dump straight to Cloudflare R2 endpoint
          const uploadResult = await fetch(r2Ticket.UploadUrl, {
            method: "PUT",
            body: fileBinary,
            headers: {
              "Content-Type": fileBinary.type,
            },
          });

          if (!uploadResult.ok) {
            throw new Error(
              `Failed to stream asset payload chunk for code: ${row.language}`,
            );
          }

          const cleanPublicCdnUrl = r2Ticket.Key;

          return {
            code: row.language,
            label: row.languageLabel || "English",
            file_name: fileBinary.name,
            subtitle_url: cleanPublicCdnUrl,
          };
        }),
      );

      toast.loading("Committing manifest records to primary database...", {
        id: uploadToastId,
      });

      await upsertVideoSubtitleSave.mutateAsync({
        video_id: videoId,
        workspaceID: workspacedata.id,
        items: finalizedItems,
      });

      console.log(finalizedItems);

      toast.success("Subtitles deployed and synchronized successfully!", {
        id: uploadToastId,
      });

      // Clear out input states cleanly upon transactional success
      // handleClear();
    } catch (error) {
      console.error("Subtitles Upload Pipeline Failure:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to execute subtitle processing chain.",
        {
          id: uploadToastId,
        },
      );
    }
  };

  return (
    <div className="w-full h-full">
      <div className="px-4 pt-3 pb-2">
        <h3 className="text-black/80 text-sm font-heading tracking-wide">
          Choose the Subtitle's
        </h3>

        <div className="flex flex-col gap-3 mt-4">
          {subtitles.map((subtitle, index) => (
            <SubtitleInputField
              key={subtitle.id}
              languageLabel={subtitle.languageLabel}
              id={subtitle.id}
              fileName={subtitle.fileName}
              language={subtitle.language}
              onFileChange={handleFileChange}
              onLanguageChange={handleLanguageChange}
              onRemove={subtitles.length > 1 ? handleRemoveSubtitle : undefined}
              showRemove={subtitles.length > 1}
              index={index}
            />
          ))}

          {/* Add Another Subtitle Button */}
          {isPremium ? (
            <button
              onClick={handleAddSubtitle}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-dashed border-black/20 text-black/60 hover:text-black/80 hover:border-black/40 hover:bg-black/[0.02] transition-all duration-200 text-sm font-medium"
            >
              <Plus className="size-4 stroke-[2]" />
              {"Add Another Subtitle "}
            </button>
          ) : (
            <Button
              variant={"outline"}
              className="w-full shadow-sm rounded-sm capitalize flex bg-white/80 leading cursor-pointer hover:text-accent hover:bg-black/2 text-accent items-center gap-3"
            >
              <Sparkles className="size-4 text-stone-600" />
              Upgrade to more
            </Button>
          )}
        </div>

        <div className="border-t-[1px] py-2 px-2 mt-2 border-black/5">
          <div className="flex justify-end flex-row gap-2 w-full">
            <Button
              // disabled={subtitles.filter((s) => s.file !== null).length == 0 || upsertVideoSubtitleSave.isPending}
              onClick={handleSubmit}
              className="tracking-wider h-8 bg-main-btn capitalize px-3 text-xs font-semibold cursor-pointer border rounded-full md:text-sm transition-all duration-200"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubtitleControl;

interface SubtitleInputFieldProps {
  id: string;
  languageLabel: string;
  fileName: string;
  language: string;
  onFileChange: (id: string, file: File | null, fileName: string) => void;
  onLanguageChange: (
    id: string,
    language: string,
    languageLabel: string,
  ) => void;
  onRemove?: (id: string) => void;
  showRemove: boolean;
  index: number;
}

function SubtitleInputField({
  id,
  fileName,
  language,
  onFileChange,
  onLanguageChange,
  onRemove,
  showRemove,
}: SubtitleInputFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onFileChange(id, file, file.name);
  };

  const handleClear = () => {
    onFileChange(id, null, "Select Your Subtitle file");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const findLabelLanguage = (code: string): string => {
    if (!code) {
      return "";
    }

    const finding = LANGUAGES.find((e) => e.code == code);

    if (!finding) {
      return "";
    }

    return finding.label;
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-white/40 rounded-xl border border-black/[0.04]">
      {/* Language Selector */}
      <div className="flex items-center gap-2">
        <Globe className="size-3.5 text-black/40 stroke-[2]" />
        <select
          value={language}
          onChange={(e) =>
            onLanguageChange(
              id,
              e.target.value,
              findLabelLanguage(e.target.value),
            )
          }
          className="text-xs font-medium text-black/70 bg-transparent border-none outline-none cursor-pointer hover:text-black/90 transition-colors"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {/* File Input Row */}
      <div className="flex flex-row items-center gap-2">
        <label htmlFor={`subtitle-input-${id}`} className="w-full flex-1">
          <div className="flex flex-row items-center justify-between gap-3 bg-white/60 w-full rounded-xl px-4 py-1 shadow-sm border border-black/[0.04] backdrop-blur-md">
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm md:text-sm font-normal text-black/80 font-content leading-relaxed select-none">
                {fileName}
              </h4>
            </div>

            <div className="shrink-0 flex items-center gap-1">
              {fileName !== "Select Your Subtitle file" && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleClear();
                  }}
                  className="p-2 transition-colors duration-200 hover:bg-black/[0.04] active:scale-95 rounded-lg flex items-center justify-center text-black/40 hover:text-black/60"
                  title="Clear selection"
                >
                  <X className="size-4 stroke-[2]" />
                </button>
              )}

              <input
                onChange={handleFileSelect}
                ref={inputRef}
                type="file"
                // accept=".srt,.vtt,.ass,.ssa,.sub"
                className="hidden"
                id={`subtitle-input-${id}`}
              />
              <div
                role="button"
                className="p-2 transition-colors duration-200 hover:bg-black/[0.04] active:scale-95 shadow-xs shadow-black/5 bg-transparent rounded-lg flex items-center justify-center"
              >
                <AppWindow className="text-black/60 size-4 stroke-[2]" />
              </div>
            </div>
          </div>
        </label>

        {/* {showRemove && onRemove && (
          <button
            onClick={() => onRemove(id)}
            className="p-2 transition-colors duration-200 hover:bg-red-50 active:scale-95 rounded-lg flex items-center justify-center text-black/40 hover:text-red-500 shrink-0"
            title="Remove subtitle field"
          >
            <X className="size-4 stroke-[2]" />
          </button>
        )} */}
      </div>
    </div>
  );
}
