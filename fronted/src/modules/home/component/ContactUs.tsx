"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";

import Link from "next/link";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Check, Globe2, Send, X } from "lucide-react";

import { WorldMap } from "@/modules/analytics/component/Map";

/* -------------------------------------------------------------------------- */
/* Config                                                                     */
/* -------------------------------------------------------------------------- */

const CONTACT_ENDPOINT = "/api/contact";

const CITIES = {
  sanFrancisco: {
    lat: 37.7749,
    lng: -122.4194,
    label: "San Francisco",
  },

  tokyo: {
    lat: 35.6762,
    lng: 139.6503,
    label: "Tokyo",
  },

  newYork: {
    lat: 40.7128,
    lng: -74.006,
    label: "New York",
  },

  london: {
    lat: 51.5074,
    lng: -0.1278,
    label: "London",
  },

  frankfurt: {
    lat: 50.1109,
    lng: 8.6821,
    label: "Frankfurt",
  },

  singapore: {
    lat: 1.3521,
    lng: 103.8198,
    label: "Singapore",
  },

  sydney: {
    lat: -33.8688,
    lng: 151.2093,
    label: "Sydney",
  },

  miami: {
    lat: 25.7617,
    lng: -80.1918,
    label: "Miami",
  },

  saoPaulo: {
    lat: -23.5505,
    lng: -46.6333,
    label: "São Paulo",
  },
};

const ROUTES = [
  {
    start: CITIES.sanFrancisco,
    end: CITIES.tokyo,
  },

  {
    start: CITIES.newYork,
    end: CITIES.london,
  },

  {
    start: CITIES.london,
    end: CITIES.frankfurt,
  },

  {
    start: CITIES.frankfurt,
    end: CITIES.singapore,
  },

  {
    start: CITIES.singapore,
    end: CITIES.sydney,
  },

  {
    start: CITIES.miami,
    end: CITIES.saoPaulo,
  },
];

const SCALES = [
  {
    value: "under-10k",
    label: "Under 10k views a month",
  },

  {
    value: "10k-100k",
    label: "10k to 100k views a month",
  },

  {
    value: "100k-1m",
    label: "100k to 1M views a month",
  },

  {
    value: "over-1m",
    label: "Over 1M views a month",
  },
];

const TRIAL_POINTS = ["14-day free trial", "No credit card", "Cancel anytime"];

/* -------------------------------------------------------------------------- */
/* Main Section                                                               */
/* -------------------------------------------------------------------------- */

export default function ContactUs() {
  const reduce = useReducedMotion();

  const [modalOpen, setModalOpen] = useState(false);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  return (
    <>
      <section
        id="contact"
        className="
          relative
          w-full
          overflow-hidden

          py-6

          sm:py-14
          lg:py-20
        "
      >
        <div
          className="
            mx-auto
            w-full
            
          "
        >
          {/* ================================================================ */}
          {/* CTA Card                                                         */}
          {/* ================================================================ */}

          <div
            className="
              relative
              isolate
              flex
              flex-col
              overflow-hidden

              rounded-[24px]
              border-[0.5px]
              border-[#172000]/15
    
              bg-[#d1ff46]z
bg-[radial-gradient(ellipse_120%_80%_at_50%_0%,#ebff94_0%,#d1ff46_60%,#b8f01b_100%)]
              shadow-[
                0_1px_2px_rgba(23,32,0,0.06),
                0_28px_48px_-28px_rgba(23,32,0,0.3)
              ]

              sm:rounded-[34px]
              lg:rounded-[36px]
            "
          >
            {/* ============================================================ */}
            {/* Background                                                   */}
            {/* ============================================================ */}

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                inset-0
                z-[1]
              "
              style={{
                background: `
                  radial-gradient(
                    70% 52% at 50% 0%,
                    rgba(255,255,255,0.70),
                    rgba(255,255,255,0) 72%
                  ),
                  linear-gradient(
                    to top,
                    rgba(88,116,0,0.18),
                    rgba(88,116,0,0) 32%
                  )
                `,
              }}
            />

            {/* very subtle structure */}

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                inset-0
                z-[1]
                opacity-[0.035]
              "
              style={{
                backgroundImage: `
                  linear-gradient(
                    rgba(23,32,0,0.75) 1px,
                    transparent 1px
                  ),
                  linear-gradient(
                    90deg,
                    rgba(23,32,0,0.75) 1px,
                    transparent 1px
                  )
                `,
                backgroundSize: "60px 60px",
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, black 55%, black 100%)",
              }}
            />

            {/* ============================================================ */}
            {/* Copy                                                         */}
            {/* ============================================================ */}

            <motion.div
              initial={
                reduce
                  ? false
                  : {
                      opacity: 0,
                      y: 16,
                    }
              }
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
                margin: "-60px",
              }}
              transition={{
                duration: 0.6,
                ease: "easeOut",
              }}
              className="
                relative
                z-10

                mx-auto

                flex
                max-w-[680px]
                flex-col
                items-center

                px-5
                pt-10

                text-center

                sm:px-6
                sm:pt-18

                lg:pt-24
              "
            >
              {/* small eyebrow */}

              <div
                className="
                  mb-4

                  inline-flex
                  items-center
                  gap-2

                  rounded-full
                  border
                  border-[#172000]/10

                  bg-white/25

                  px-3
                  py-1.5

                  text-[10px]
                  font-semibold
                  text-[#324000]

                  shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]

                  backdrop-blur-sm

                  sm:mb-5
                  sm:text-[11px]
                "
              >
                <span className="relative flex size-1.5">
                  <span
                    className="
                      absolute
                      inline-flex
                      size-full
                      animate-ping
                      rounded-full
                      bg-[#587400]
                      opacity-30
                    "
                  />

                  <span
                    className="
                      relative
                      inline-flex
                      size-1.5
                      rounded-full
                      bg-[#1a5c0467]
                    "
                  />
                </span>
                Global video infrastructure
              </div>

              {/* heading */}

              <h2
                className="
                  max-w-[360px]

                  text-balance

                  font-heading

                  text-[34px]
                  font-semibold

                  leading-[0.98]

                  tracking-[-0.045em]

                  text-[#172000]

                  sm:max-w-[650px]
                  sm:text-[54px]

                  lg:text-[64px]
                "
              >
                Upload once. Play everywhere, instantly.
              </h2>

              {/* description */}

              <p
                className="
                  mt-4

                  max-w-[440px]

                  text-[14px]
                  leading-[1.55]
                 text-muted-foreground
                  text-[#354500]/80z

                  sm:mt-5
                  sm:max-w-[470px]
                  sm:text-[15px]
                  sm:leading-6
                "
              >
                Cinevo encodes every video for every screen and serves it from
                the edge closest to your viewer.
              </p>

              {/* ======================================================== */}
              {/* Buttons                                                  */}
              {/* ======================================================== */}

              <div
                className="
    mt-6
    flex
    w-full
    flex-col
    items-stretch
    justify-center
    gap-2.5
    sm:mt-8
    sm:w-auto
    sm:flex-row
    sm:gap-3
  "
              >
                <Link
                  href="/register"
                  className="
      secondary-btn
      h-10
      w-full
      justify-center
      rounded-lg
      px-6
      sm:w-auto
    "
                >
                  Start free trial
                </Link>

                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="
      flex
      h-10
      w-full
      items-center
      justify-center
      rounded-lg
      border
      border-white/10
      bg-[#11120e]
      px-6
      font-heading
      text-sm
      font-semibold
      text-white
      shadow-xs
      transition-all
      hover:bg-[#1a1c17]
      hover:border-white/20
      active:scale-[0.98]
      cursor-pointer
      sm:w-auto
    "
                >
                  Talk to us
                </button>
              </div>

              {/* ======================================================== */}
              {/* Trial points                                              */}
              {/* ======================================================== */}

              <ul
                className="
                  mt-4

                  flex
                  max-w-[310px]
                  flex-wrap
                  justify-center

                  gap-x-3
                  gap-y-1.5

                  text-[10px]
                  font-medium

                  text-[#354500]/80

                  sm:mt-5
                  sm:max-w-none
                  sm:gap-x-4
                  sm:text-xs
                "
              >
                {TRIAL_POINTS.map((point) => (
                  <li key={point} className="flex items-center gap-1.5">
                    <Check
                      className="
                        size-3
                        shrink-0

                        sm:size-3.5
                      "
                      aria-hidden="true"
                    />

                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* ============================================================ */}
            {/* White Dotted World Map                                       */}
            {/* ============================================================ */}

            {/* ============================================================ */}
            {/* Global edge map                                              */}
            {/* ============================================================ */}

            <motion.div
              aria-hidden="true"
              initial={
                reduce
                  ? false
                  : {
                      opacity: 0,
                      y: 12,
                    }
              }
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{ once: true }}
              transition={{
                duration: 0.85,
                delay: 0.15,
                ease: "easeOut",
              }}
              className="
    pointer-events-none
    relative
    z-0

    mt-1

    flex
    max-h-[220px]
    justify-center
    overflow-hidden

    -mb-[17%]

    sm:mt-3
    sm:max-h-none
    sm:-mb-[7%]
  "
              style={{
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, #000 18%, #000 90%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, #000 18%, #000 90%, transparent 100%)",
              }}
            >
              {/* subtle darker bed behind map */}
              <div
                className="
      absolute
      left-1/2
      top-[54%]

      h-[165px]
      w-[92%]

      -translate-x-1/2
      -translate-y-1/2

      rounded-[50%]

      bg-[#789400]/10

      blur-[48px]

      sm:h-[230px]
      sm:w-[78%]
      sm:bg-[#789400]/8
      sm:blur-[70px]
    "
              />

              {/* soft white highlight over map */}
              <div
                className="
      absolute
      left-1/2
      top-[45%]

      h-[130px]
      w-[60%]

      -translate-x-1/2
      -translate-y-1/2

      rounded-full

      bg-white/8

      blur-[60px]
    "
              />

              <WorldMap
                dots={ROUTES}
                /* bright routes */
                lineColor="rgba(255,255,255,0.92)"
                /* visible but still soft continent dots */
                // dotColor="rgba(37,49,0,0.24)"
                dotColor="rgba(37,49,0,0.24)"
                backgroundColor="transparent"
                className="
      relative
      z-[2]

      aspect-[2.7/1]

      w-[168%]
      max-w-none
      shrink-0

      bg-transparent

      opacity-[0.95]

      drop-shadow-[0_1px_0_rgba(255,255,255,0.10)]

      sm:aspect-[2.3/1]
      sm:w-[122%]

      lg:aspect-[2.15/1]
      lg:w-full
    "
                labelClassName="
      hidden

      sm:block

      sm:rounded-md

      sm:border
      sm:border-white/55

      sm:bg-white/70

      sm:px-2
      sm:py-0.5

      sm:text-[9px]
      sm:font-semibold
      sm:text-[#263300]

      sm:shadow-[0_2px_8px_rgba(52,70,0,0.08)]

      sm:backdrop-blur-md
    "
              />
            </motion.div>

            {/* ============================================================ */}
            {/* Edge status pill                                              */}
            {/* ============================================================ */}

            <div
              className="
                pointer-events-none

                absolute
                bottom-3
                left-1/2
                z-10

                flex
                -translate-x-1/2
                items-center

                gap-1.5

                whitespace-nowrap

                rounded-full

                border
                border-white/10

                bg-[#172000]

                px-2.5
                py-1.5

                text-[9px]
                font-semibold
                text-white

                shadow-[0_8px_18px_rgba(23,32,0,0.16)]

                sm:bottom-5
                sm:gap-2
                sm:px-3.5
                sm:py-2
                sm:text-[11px]
              "
            >
              <span
                className="
                  relative
                  flex
                  size-1.5

                  sm:size-2
                "
                aria-hidden="true"
              >
                <span
                  className="
                    absolute
                    inline-flex
                    size-full

                    rounded-full

                    bg-white/70

                    opacity-50

                    motion-safe:animate-ping
                  "
                />

                <span
                  className="
                    relative
                    inline-flex
                    size-full

                    rounded-full

                    bg-white
                  "
                />
              </span>
              320+ edge locations
              <Globe2
                className="
                  size-3
                  text-white/90

                  sm:size-3.5
                "
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* Modal                                                                  */}
      {/* ====================================================================== */}

      <AnimatePresence>
        {modalOpen && <ContactModal onClose={closeModal} />}
      </AnimatePresence>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal Types                                                                */
/* -------------------------------------------------------------------------- */

type FormState = {
  name: string;
  email: string;
  scale: string;
  message: string;
};

type Status = "idle" | "sending" | "sent" | "error";

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  scale: SCALES[1].value,
  message: "",
};

/* -------------------------------------------------------------------------- */
/* Form field                                                                 */
/* -------------------------------------------------------------------------- */

const fieldClass = `
  w-full

  rounded-lg

  border-[0.5px]
  border-black/15

  bg-neutral-50

  px-3

  text-base
  text-neutral-900

  outline-none

  transition

  placeholder:text-neutral-400

  focus-visible:border-[#587400]
  focus-visible:bg-white
  focus-visible:ring-2
  focus-visible:ring-[#d1ff46]/70

  sm:text-[13px]
`;

function Field({
  id,
  label,
  optional,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="
          mb-1.5

          flex
          items-baseline
          justify-between

          text-xs
          font-semibold

          text-neutral-700
        "
      >
        {label}

        {optional && (
          <span className="font-normal text-neutral-400">Optional</span>
        )}
      </label>

      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Contact modal                                                              */
/* -------------------------------------------------------------------------- */

function ContactModal({ onClose }: { onClose: () => void }) {
  const reduce = useReducedMotion();

  const uid = useId();

  const dialogRef = useRef<HTMLDivElement>(null);

  const nameRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [status, setStatus] = useState<Status>("idle");

  const update =
    (key: keyof FormState) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      setForm((current) => ({
        ...current,
        [key]: e.target.value,
      }));
    };

  /* ------------------------------------------------------------------------ */
  /* Modal keyboard + focus handling                                          */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    nameRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();

        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const nodes = dialogRef.current.querySelectorAll<HTMLElement>(
        `
            input,
            select,
            textarea,
            button:not([disabled]),
            a[href]
          `,
      );

      if (!nodes.length) {
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();

        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();

        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);

      document.body.style.overflow = previousOverflow;

      opener?.focus?.();
    };
  }, [onClose]);

  /* ------------------------------------------------------------------------ */
  /* Submit                                                                   */
  /* ------------------------------------------------------------------------ */

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setStatus("sending");

    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  const titleId = `${uid}-title`;

  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      transition={{
        duration: 0.18,
      }}
      className="
        fixed
        inset-0
        z-[100]

        flex
        items-end
        justify-center

        bg-black/40

        backdrop-blur-sm

        sm:items-center
        sm:p-4
      "
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{
          opacity: 0,
          y: reduce ? 0 : 16,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          y: reduce ? 0 : 12,
        }}
        transition={{
          duration: 0.22,
          ease: "easeOut",
        }}
        className="
          relative

          max-h-[92dvh]

          w-full
          max-w-[460px]

          overflow-y-auto

          rounded-t-[24px]

          border-[0.5px]
          border-black/10

          bg-white

          p-6

          shadow-2xl

          sm:rounded-[22px]
          sm:p-7
        "
      >
        {/* lime accent */}

        <div
          className="
            absolute
            inset-x-0
            top-0

            h-1

            bg-[#d1ff46]
          "
        />

        {/* ================================================================ */}
        {/* Header                                                           */}
        {/* ================================================================ */}

        <div className="flex items-start justify-between gap-5">
          <div>
            <h3
              id={titleId}
              className="
                font-heading

                text-lg
                font-semibold

                tracking-tight

                text-neutral-950
              "
            >
              Talk to us
            </h3>

            <p
              className="
                mt-1

                max-w-[340px]

                text-xs
                leading-5

                text-neutral-500
              "
            >
              Tell us what you&apos;re building and we&apos;ll suggest the right
              setup.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="
              flex
              size-8
              shrink-0
              items-center
              justify-center

              rounded-full

              text-neutral-400

              transition

              hover:bg-neutral-100
              hover:text-neutral-900

              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-neutral-900/40
            "
          >
            <X className="size-4" />
          </button>
        </div>

        {/* ================================================================ */}
        {/* Success state                                                     */}
        {/* ================================================================ */}

        {status === "sent" ? (
          <div
            className="
              flex
              flex-col
              items-center

              py-8

              text-center
            "
          >
            <div
              className="
                flex
                size-12
                items-center
                justify-center

                rounded-full

                bg-[#efffc5]

                text-[#587400]
              "
            >
              <Check className="size-5" aria-hidden="true" />
            </div>

            <h4
              className="
                mt-4

                text-sm
                font-semibold

                text-neutral-950
              "
            >
              Message sent
            </h4>

            <p
              className="
                mt-1

                max-w-[300px]

                break-words

                text-xs
                leading-5

                text-neutral-500
              "
            >
              We&apos;ll reply to {form.email}.
            </p>

            <button
              type="button"
              autoFocus
              onClick={onClose}
              className="
                secondary-btn

                mt-6
                h-10

                rounded-lg

                px-5
              "
            >
              Close
            </button>
          </div>
        ) : (
          /* ================================================================ */
          /* Form                                                             */
          /* ================================================================ */

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Name */}

            <Field id={`${uid}-name`} label="Your name">
              <input
                ref={nameRef}
                id={`${uid}-name`}
                required
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={update("name")}
                placeholder="Alex Morgan"
                className={`${fieldClass} h-10`}
              />
            </Field>

            {/* Email */}

            <Field id={`${uid}-email`} label="Work email">
              <input
                id={`${uid}-email`}
                required
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={update("email")}
                placeholder="alex@company.com"
                className={`${fieldClass} h-10`}
              />
            </Field>

            {/* Scale */}

            <Field id={`${uid}-scale`} label="Monthly views">
              <select
                id={`${uid}-scale`}
                value={form.scale}
                onChange={update("scale")}
                className={`${fieldClass} h-10`}
              >
                {SCALES.map((scale) => (
                  <option key={scale.value} value={scale.value}>
                    {scale.label}
                  </option>
                ))}
              </select>
            </Field>

            {/* Message */}

            <Field
              id={`${uid}-message`}
              label="What are you building?"
              optional
            >
              <textarea
                id={`${uid}-message`}
                rows={4}
                value={form.message}
                onChange={update("message")}
                placeholder="Tell us about your video product"
                className={`
                  ${fieldClass}
                  resize-none
                  py-2.5
                `}
              />
            </Field>

            {/* Error */}

            {status === "error" && (
              <p
                role="alert"
                className="
                  text-xs
                  leading-5
                  text-red-600
                "
              >
                Something went wrong and your message wasn&apos;t sent. Try
                again.
              </p>
            )}

            {/* Submit */}

            <button
              type="submit"
              disabled={status === "sending"}
              className="
                primary-btn

                mt-1

                h-11
                w-full

                justify-center

                rounded-xl

                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {status === "sending" ? "Sending…" : "Send message"}

              {status !== "sending" && (
                <Send className="size-3.5" aria-hidden="true" />
              )}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
