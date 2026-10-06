import React from "react";
import { ReviewCard } from "./ReviewCard";

const REVIEWS = [
  {
    id: "review-1",
    photo:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces&auto=format&q=80",
    name: "Jack Qi",
    role: "Co-Founder, Edcafe",
    review: (
      <p className="mt-3 font-heading text-[17px] font-medium leading-relaxed tracking-tight text-neutral-700">
        “We tried setting up AWS MediaConvert,{" "}
        <span className="rounded-[5px] bg-[#dbeafe] px-1.5 py-0.5 font-semibold text-neutral-900">
          wrestled with FFmpeg
        </span>{" "}
        <span className="rounded-[5px] bg-[#dbeafe] px-1.5 py-0.5 font-semibold text-neutral-900">
          and eventually gave up...
        </span>{" "}
        Rowley just works out of the box. Zero buffer lag and our transcode
        pipeline runs completely hands-free.”
      </p>
    ),
  },
  {
    id: "review-2",
    photo:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces&auto=format&q=80",
    name: "Marcus Vance",
    role: "CTO, HyperCourse",
    review: (
      <p className="mt-3 font-heading text-[17px] font-medium leading-relaxed tracking-tight text-neutral-700">
        “Delivering adaptive HLS streams used to bottleneck every release. With
        Rowley, our{" "}
        <span className="rounded-[5px] bg-[#dbeafe] px-1.5 py-0.5 font-semibold text-neutral-900">
          encoding time dropped by 70%
        </span>{" "}
        <span className="rounded-[5px] bg-[#dbeafe] px-1.5 py-0.5 font-semibold text-neutral-900">
          with zero player hiccups
        </span>
        . It completely replaced hundreds of lines of fragile backend scripts.”
      </p>
    ),
  },
];

export default function ReviewSection() {
  return (
    <section className="mx-auto w-full max-w-5xl py-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        {REVIEWS.map(({ id, photo, review, name, role }) => (
          <ReviewCard
            key={id}
            photo={photo}
            review={review}
            name={name}
            role={role}
          />
        ))}
      </div>
    </section>
  );
}