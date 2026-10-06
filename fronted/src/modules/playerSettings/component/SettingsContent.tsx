"use client";

import React from "react";
import PlayerTab from "./PlayerTab";
import AppearanceTab from "./AppearanceTab";
import AdvancedTab from "./AdvancedTab";

export default function SettingsContent({
  activeOption,
}: {
  activeOption: "player" | "appearance" | "advanced" | string | undefined;
}) {
  switch (activeOption) {
    case "appearance":
      return <AppearanceTab />;
    case "advanced":
      return <AdvancedTab />;
    case "player":
    default:
      return <PlayerTab />;
  }
}