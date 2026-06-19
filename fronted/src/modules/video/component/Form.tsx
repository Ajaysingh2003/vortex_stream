import React from "react";
import UpdatePlan from "./UpdatePlan";
import { Divide } from "lucide-react";
import CaptureLeads from "./CaptureLeads";

function Form() {
  // Try changing this to true to see the height expand seamlessly!
  const isPremium = false;

  return (
    <div className="w-full h-full overflow-scroll min-h-[112px]z relative">
      <div
        className={`w-full px-3  transition-all duration-300 ease-in-out  ${
          isPremium ? "h-full" : "h-54"
        }`}
      >
        <div className="w-full h-full">
          {isPremium ? <CaptureLeads /> : <UpdatePlan />}
        </div>
      </div>
    </div>
  );
}

export default Form;
