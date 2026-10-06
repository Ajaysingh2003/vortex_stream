"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Play, Palette, SlidersHorizontal, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { VideoPlayerSettings } from "@/modules/types";
import SettingsContent from "./SettingsContent";

export type SettingsTab = "player" | "appearance" | "advanced";

interface PlayerContextType {
  selectedOption: SettingsTab;
  setSelectOption: (value: SettingsTab) => void;
  playerSettings: VideoPlayerSettings;
  setPlayerSettings: React.Dispatch<React.SetStateAction<VideoPlayerSettings>>;
}

const SettingContext = createContext<PlayerContextType | null>(null);

interface SettingsProps {
  children?: React.ReactNode;
  playerSettings: VideoPlayerSettings;
  setPlayerSettings: React.Dispatch<React.SetStateAction<VideoPlayerSettings>>;
  className?: string;
}

export function Settings({
  children,
  playerSettings,
  setPlayerSettings,
  className,
}: SettingsProps) {
  const [selectedOption, setSelectOption] = useState<SettingsTab>("player");

  const value = useMemo(
    () => ({ selectedOption, setSelectOption, playerSettings, setPlayerSettings }),
    [selectedOption, playerSettings, setPlayerSettings],
  );

  return (
    <SettingContext.Provider value={value}>
      <div
        className={cn(
          "overflow-hidden rounded-2xl border-[0.5px] border-black/10 bg-white",
          "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)]",
          "dark:border-white/10 dark:bg-[#111215] dark:shadow-none",
          className,
        )}
      >
        <Menu />
        <Content />
        {children}
      </div>
    </SettingContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* Menu                                                                       */
/* -------------------------------------------------------------------------- */

const TABS: Array<{ label: string; value: SettingsTab; icon: LucideIcon }> = [
  { label: "Player", value: "player", icon: Play },
  { label: "Appearance", value: "appearance", icon: Palette },
  { label: "Advanced", value: "advanced", icon: SlidersHorizontal },
];

const TAB_PADDING = 12; // px-3 on each tab, used to inset the indicator

const Menu = () => {
  const { selectedOption, setSelectOption } = useSetting();
  const tabRefs = useRef<Record<SettingsTab, HTMLButtonElement | null>>({
    player: null,
    appearance: null,
    advanced: null,
  });
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  const measure = useCallback(() => {
    const el = tabRefs.current[selectedOption];
    if (!el) return;
    setIndicator({
      left: el.offsetLeft + TAB_PADDING,
      width: el.offsetWidth - TAB_PADDING * 2,
    });
  }, [selectedOption]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const last = TABS.length - 1;
    let next = index;
    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;

    event.preventDefault();
    const target = TABS[next].value;
    setSelectOption(target);
    tabRefs.current[target]?.focus();
  }

  return (
    <div className="border-b-[0.5px] border-black/10 bg-neutral-50/60 px-2 dark:border-white/10 dark:bg-white/[0.02]">
      <div role="tablist" aria-label="Player settings" className="relative flex items-center">
        {TABS.map(({ label, value, icon: Icon }, index) => {
          const active = selectedOption === value;
          return (
            <button
              key={value}
              ref={(el) => {
                tabRefs.current[value] = el;
              }}
              id={`settings-tab-${value}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`settings-panel-${value}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setSelectOption(value)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={cn(
                "relative flex h-12 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-3",
                "font-subheading text-[13.5px] font-medium outline-none transition-colors duration-150",
                "focus-visible:ring-2 focus-visible:ring-[#B3E61D]/50 focus-visible:ring-inset",
                active
                  ? "text-zinc-950 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200",
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-colors duration-150",
                  active ? "text-zinc-950 dark:text-zinc-50" : "text-zinc-400 dark:text-zinc-600",
                )}
                strokeWidth={1.75}
              />
              {label}
            </button>
          );
        })}

        {/* Sliding indicator */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute bottom-0 left-0 h-[2px] rounded-full bg-[#B3E61D]",
            "shadow-[0_0_8px_rgba(179,230,29,0.45)]",
            "transition-[transform,width,opacity] duration-250 ease-out motion-reduce:transition-none",
            indicator ? "opacity-100" : "opacity-0",
          )}
          style={{
            width: indicator?.width ?? 0,
            transform: `translateX(${indicator?.left ?? 0}px)`,
          }}
        />
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Content                                                                    */
/* -------------------------------------------------------------------------- */

const Content = () => {
  const { selectedOption } = useSetting();

  return (
    <div
      key={selectedOption}
      id={`settings-panel-${selectedOption}`}
      role="tabpanel"
      aria-labelledby={`settings-tab-${selectedOption}`}
      tabIndex={0}
      className="animate-in fade-in-0 slide-in-from-bottom-1 px-5 py-5 outline-none duration-200 focus-visible:ring-2 focus-visible:ring-[#B3E61D]/40 focus-visible:ring-inset"
    >
      <SettingsContent activeOption={selectedOption} />
    </div>
  );
};

Settings.Menu = Menu;
Settings.Content = Content;

/* -------------------------------------------------------------------------- */
/* Hook                                                                       */
/* -------------------------------------------------------------------------- */

export const useSetting = () => {
  const context = useContext(SettingContext);

  if (!context) {
    throw new Error("useSetting must be used inside <Settings />");
  }

  return context;
};

export default Settings;