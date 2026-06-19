import { Input } from "@/components/ui/input";

// VideoDurationInput.tsx
interface VideoDurationInputProps {
  videoDurationInSeconds: number;
  value: number;
  onChange: (seconds: number) => void;
}

export default function VideoDurationInput({
  videoDurationInSeconds = 6000,
  value,
  onChange,
}: VideoDurationInputProps) {
  const formatSecondsToTimestamp = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseFloat(e.target.value) || 0;
    if (val > videoDurationInSeconds) val = videoDurationInSeconds;
    if (val < 0) val = 0;
    onChange(val);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[12px] font-semibold text-neutral-700 uppercase tracking-wider">
        Trigger Timestamp
      </label>
      <div className="flex items-center gap-2 w-full">
        <input
          type="range"
          min={0}
          max={videoDurationInSeconds}
          value={value}
          onChange={handleInputChange}
          className="flex-1 h-1.5 accent-neutral-900 bg-neutral-200 rounded-lg cursor-pointer appearance-none"
        />
        <div className="relative w-28 shrink-0">
          <Input
            type="number"
            min={0}
            max={videoDurationInSeconds}
            step={1}
            value={value}
            onChange={handleInputChange}
            className="pr-12 text-center font-mono rounded-lg h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          
          {/* <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-400 bg-white pl-1 pointer-events-none">
            sec
          </span> */}

        </div>
      </div>
      <span className="text-[11px] font-medium text-neutral-400 font-mono">
        Overlay will appear at:{" "}
        <strong className="text-neutral-700">
          {formatSecondsToTimestamp(value)}
        </strong>{" "}
        / {formatSecondsToTimestamp(videoDurationInSeconds)}
      </span>
    </div>
  );
}