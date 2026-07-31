import React from "react";
import UpdatePlan from "./UpdatePlan";
import ChaptersShow from "./ChaptersShow";

function Chapters() {
  const isPremium = true;
  return (
    <div className="w-full h-full py-4z ">
      {!isPremium ? (
        <UpdatePlan
          title="Streamline Video Navigation"
          description="Insert timestamped chapters to let viewers jump directly to key moments."
        />
      ) : (
        <ChaptersShow isPremium />
      )}
    </div>
  );
}

export default Chapters;
