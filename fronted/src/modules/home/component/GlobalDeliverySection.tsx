"use client";

import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import createGlobe from "cobe";
import {
  Activity,
  Check,
  Globe2,
  Radio,
  Wifi,
} from "lucide-react";

interface NodeLocation {
  id: string;
  city: string;
  country: string;
  latency: string;
  location: [number, number];
}

const CDN_NODES: NodeLocation[] = [
  {
    id: "london",
    city: "London",
    country: "UK",
    latency: "14ms",
    location: [51.5074, -0.1278],
  },
  {
    id: "new-york",
    city: "New York",
    country: "US",
    latency: "24ms",
    location: [40.7128, -74.006],
  },
  {
    id: "frankfurt",
    city: "Frankfurt",
    country: "DE",
    latency: "18ms",
    location: [50.1109, 8.6821],
  },
  {
    id: "mumbai",
    city: "Mumbai",
    country: "IN",
    latency: "22ms",
    location: [19.076, 72.8777],
  },
  {
    id: "singapore",
    city: "Singapore",
    country: "SG",
    latency: "27ms",
    location: [1.3521, 103.8198],
  },
  {
    id: "tokyo",
    city: "Tokyo",
    country: "JP",
    latency: "31ms",
    location: [35.6762, 139.6503],
  },
  {
    id: "sydney",
    city: "Sydney",
    country: "AU",
    latency: "38ms",
    location: [-33.8688, 151.2093],
  },
];

const CDN_ARCS = [
  {
    from: CDN_NODES[0].location,
    to: CDN_NODES[1].location,
  },
  {
    from: CDN_NODES[0].location,
    to: CDN_NODES[2].location,
  },
  {
    from: CDN_NODES[2].location,
    to: CDN_NODES[3].location,
  },
  {
    from: CDN_NODES[3].location,
    to: CDN_NODES[4].location,
  },
  {
    from: CDN_NODES[4].location,
    to: CDN_NODES[5].location,
  },
  {
    from: CDN_NODES[4].location,
    to: CDN_NODES[6].location,
  },
];

const METRICS = [
  {
    value: "99.99%",
    label: "Uptime SLA",
    description: "Global edge availability",
  },
  {
    value: "24ms",
    label: "Median latency",
    description: "Viewer to nearest edge",
  },
  {
    value: "96.8%",
    label: "Cache hit ratio",
    description: "Requests served at edge",
  },
];

export default function GlobalDeliverySection() {
  const [activeNode, setActiveNode] =
    useState("frankfurt");

  const active =
    CDN_NODES.find(
      (node) => node.id === activeNode,
    ) ?? CDN_NODES[0];

  return (
    <section
      className="
        relative
        w-full
        overflow-hidden
        bg-transparent
        py-20
        sm:py-24
        lg:py-28
      "
    >
      {/* subtle background dots */}
      <div
        aria-hidden
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.14]
        "
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,0,0,.14) .65px, transparent .65px)",
          backgroundSize: "24px 24px",

          WebkitMaskImage:
            "radial-gradient(ellipse 72% 62% at 50% 52%, black, transparent 78%)",

          maskImage:
            "radial-gradient(ellipse 72% 62% at 50% 52%, black, transparent 78%)",
        }}
      />

      <div
        className="
          relative
          z-10
          mx-auto
          max-w-7xl
          px-4
          sm:px-6
          lg:px-8
        "
      >
        {/* =========================
            HEADER
        ========================== */}

        <div className="mx-auto max-w-3xl text-center">
          <div
            className="
              mb-5
              inline-flex
              items-center
              gap-2

              rounded-full

              border
              border-black/[0.06]

              bg-background/50

              px-3
              py-1.5

              backdrop-blur-xl
            "
          >
            <span className="relative flex size-2">
              <span
                className="
                  absolute
                  inline-flex
                  size-full
                  animate-ping
                  rounded-full
                  bg-[#d1ff46]
                  opacity-40
                "
              />

              <span
                className="
                  relative
                  size-2
                  rounded-full
                  bg-[#d1ff46]
                  ring-1
                  ring-black/10
                "
              />
            </span>

            <span
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.16em]
                text-neutral-500
              "
            >
              Global edge network
            </span>
          </div>

          <h2
            className="
              font-heading

              text-[40px]
              font-black
              leading-[1.04]
              tracking-[-0.05em]

              text-neutral-950

              sm:text-5xl
              md:text-6xl
            "
          >
            Video that feels local,
            <span className="block text-neutral-400">
              everywhere.
            </span>
          </h2>

          <p
            className="
              mx-auto
              mt-5
              max-w-xl

              text-[15px]
              leading-7
              text-neutral-500

              sm:text-lg
            "
          >
            Deliver every stream from the closest
            healthy edge for faster starts, smoother
            playback and lower latency.
          </p>
        </div>

        {/* =========================
            GLOBE STAGE
        ========================== */}

        <div
          className="
            relative
            mx-auto

            mt-4

            h-[410px]
            w-full
            max-w-6xl

            sm:mt-7
            sm:h-[580px]

            lg:h-[650px]
          "
        >
          {/* lime ambient bloom */}
          <div
            aria-hidden
            className="
              pointer-events-none
              absolute

              left-1/2
              top-[52%]

              size-[330px]

              -translate-x-1/2
              -translate-y-1/2

              rounded-full

              bg-[#d1ff46]/10

              blur-[100px]

              sm:size-[580px]
              sm:blur-[140px]
            "
          />

          <LiveCDNGlobe
            activeNode={activeNode}
            setActiveNode={setActiveNode}
          />

          {/* =========================
              EDGE STATUS
          ========================== */}

          <div
            className="
              absolute

              bottom-3
              left-1/2
              z-30

              flex
              -translate-x-1/2
              items-center
              gap-2.5

              whitespace-nowrap

              rounded-xl

              border
              border-black/[0.06]

              bg-background/65

              px-3
              py-2.5

              shadow-[0_12px_40px_-20px_rgba(0,0,0,.2)]

              backdrop-blur-2xl

              sm:bottom-14
              sm:left-8
              sm:translate-x-0
            "
          >
            <span
              className="
                flex
                size-7
                items-center
                justify-center

                rounded-lg

                bg-neutral-950
              "
            >
              <Radio className="size-3 text-[#d1ff46]" />
            </span>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className="
                    text-[11px]
                    font-semibold
                    text-neutral-900
                  "
                >
                  {active.city} edge
                </span>

                <span
                  className="
                    rounded
                    bg-[#d1ff46]

                    px-1.5
                    py-0.5

                    text-[8px]
                    font-bold
                    text-black
                  "
                >
                  {active.latency}
                </span>
              </div>

              <span
                className="
                  mt-0.5
                  block

                  text-[8px]
                  font-medium
                  uppercase
                  tracking-[0.1em]

                  text-neutral-400
                "
              >
                closest healthy POP
              </span>
            </div>
          </div>

          {/* route status */}
          <div
            className="
              absolute

              bottom-14
              right-8
              z-30

              hidden
              items-center
              gap-2.5

              rounded-xl

              border
              border-black/[0.06]

              bg-background/65

              px-3
              py-2.5

              shadow-[0_12px_40px_-20px_rgba(0,0,0,.2)]

              backdrop-blur-2xl

              sm:flex
            "
          >
            <span
              className="
                flex
                size-7
                items-center
                justify-center

                rounded-lg

                bg-[#d1ff46]
              "
            >
              <Wifi className="size-3 text-black" />
            </span>

            <div>
              <div
                className="
                  flex
                  items-center
                  gap-1.5

                  text-[11px]
                  font-semibold

                  text-neutral-900
                "
              >
                Optimal route

                <Check className="size-3 text-emerald-600" />
              </div>

              <span
                className="
                  mt-0.5
                  block

                  text-[8px]
                  uppercase
                  tracking-[0.1em]

                  text-neutral-400
                "
              >
                automatic failover
              </span>
            </div>
          </div>
        </div>

        {/* =========================
            METRICS
        ========================== */}

        <div
          className="
            mx-auto

            grid
            max-w-5xl

            border-y
            border-black/[0.06]

            md:grid-cols-3
          "
        >
          {METRICS.map(
            (metric, index) => (
              <div
                key={metric.label}
                className={`
                  group
                  relative

                  px-5
                  py-6

                  sm:px-7
                  sm:py-8

                  ${
                    index !==
                    METRICS.length - 1
                      ? `
                        border-b
                        border-black/[0.06]

                        md:border-b-0
                        md:border-r
                      `
                      : ""
                  }
                `}
              >
                <div
                  className="
                    absolute
                    inset-x-5
                    top-0

                    h-px

                    origin-left
                    scale-x-0

                    bg-[#d1ff46]

                    transition-transform
                    duration-500

                    group-hover:scale-x-100
                  "
                />

                <div
                  className="
                    mb-4
                    flex
                    items-center
                    justify-between
                  "
                >
                  <div className="flex items-center gap-2">
                    <Activity className="size-3.5 text-neutral-400" />

                    <span
                      className="
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-[0.1em]
                        text-neutral-400
                      "
                    >
                      {metric.label}
                    </span>
                  </div>

                  <div
                    className="
                      flex
                      items-center
                      gap-1.5

                      text-[9px]
                      font-semibold

                      text-emerald-600
                    "
                  >
                    <span className="size-1.5 rounded-full bg-emerald-500" />

                    healthy
                  </div>
                </div>

                <div
                  className="
                    font-heading

                    text-3xl
                    font-black
                    tracking-[-0.045em]

                    text-neutral-950

                    sm:text-[38px]
                  "
                >
                  {metric.value}
                </div>

                <p
                  className="
                    mt-1
                    text-xs
                    text-neutral-400
                  "
                >
                  {metric.description}
                </p>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   GLOBE
========================================================= */

function LiveCDNGlobe({
  activeNode,
  setActiveNode,
}: {
  activeNode: string;

  setActiveNode: React.Dispatch<
    React.SetStateAction<string>
  >;
}) {
  const canvasRef =
    useRef<HTMLCanvasElement>(null);

  const wrapperRef =
    useRef<HTMLDivElement>(null);

  const globeRef =
    useRef<ReturnType<
      typeof createGlobe
    > | null>(null);

  const pointerDownRef =
    useRef<number | null>(null);

  const rotationRef = useRef(0);

  const dragRef = useRef(0);

  const sizeRef = useRef(500);

  const activeRef =
    useRef(activeNode);

  /* ---------------------------------------------
     Update markers without rebuilding globe
  --------------------------------------------- */

  useEffect(() => {
    activeRef.current = activeNode;

    globeRef.current?.update({
      markers: CDN_NODES.map(
        (node) => ({
          id: node.id,

          location:
            node.location,

          size:
            node.id === activeNode
              ? 0.055
              : 0.033,

          color:
            node.id === activeNode
              ? ([0.82, 1, 0.27] as [
                  number,
                  number,
                  number,
                ])
              : ([0.35, 0.38, 0.35] as [
                  number,
                  number,
                  number,
                ]),
        }),
      ),
    });
  }, [activeNode]);

  useEffect(() => {
    const canvas =
      canvasRef.current;

    const wrapper =
      wrapperRef.current;

    if (!canvas || !wrapper) {
      return;
    }

    const dpr = Math.min(
      window.devicePixelRatio || 1,
      2,
    );

    const updateSize = () => {
      sizeRef.current =
        wrapper.offsetWidth;

      return sizeRef.current;
    };

    const initialSize =
      updateSize();

    const globe = createGlobe(
      canvas,
      {
        devicePixelRatio: dpr,

        width:
          initialSize * dpr,

        height:
          initialSize * dpr,

        /*
         * Puts Europe / Asia in a
         * nice initial position.
         */
        phi: 0.72,

        theta: 0.17,

        dark: 0,

        diffuse: 1.12,

        mapSamples: 28000,

        /*
         * Softer than previous version.
         * Keeps globe elegant rather
         * than overly contrasty.
         */
        mapBrightness: 5.5,

        mapBaseBrightness: 0,

        baseColor: [
          0.91,
          0.93,
          0.9,
        ],

        markerColor: [
          0.82,
          1,
          0.27,
        ],

        glowColor: [
          0.97,
          0.98,
          0.96,
        ],

        markerElevation: 0.035,

        markers:
          CDN_NODES.map(
            (node) => ({
              /*
               * Important:
               * Cobe uses this id
               * as the CSS anchor.
               */
              id: node.id,

              location:
                node.location,

              size:
                node.id ===
                activeRef.current
                  ? 0.055
                  : 0.033,

              color:
                node.id ===
                activeRef.current
                  ? ([
                      0.82,
                      1,
                      0.27,
                    ] as [
                      number,
                      number,
                      number,
                    ])
                  : ([
                      0.35,
                      0.38,
                      0.35,
                    ] as [
                      number,
                      number,
                      number,
                    ]),
            }),
          ),

        arcs: CDN_ARCS,

        arcColor: [
          0.82,
          1,
          0.27,
        ],

        arcWidth: 0.45,

        arcHeight: 0.2,

        scale: 1,

        opacity: 1,
      },
    );

    globeRef.current =
      globe;

    let animationFrame = 0;

    let destroyed = false;

    const resizeObserver =
      new ResizeObserver(() => {
        const nextSize =
          updateSize();

        globe.update({
          width:
            nextSize * dpr,

          height:
            nextSize * dpr,
        });
      });

    resizeObserver.observe(
      wrapper,
    );

    const animate = () => {
      if (destroyed) return;

      if (
        pointerDownRef.current ===
        null
      ) {
        rotationRef.current +=
          0.0009;
      }

      globe.update({
        phi:
          0.72 +
          rotationRef.current +
          dragRef.current,

        theta: 0.17,
      });

      animationFrame =
        requestAnimationFrame(
          animate,
        );
    };

    animationFrame =
      requestAnimationFrame(
        animate,
      );

    requestAnimationFrame(() => {
      canvas.style.opacity = "1";
    });

    return () => {
      destroyed = true;

      resizeObserver.disconnect();

      cancelAnimationFrame(
        animationFrame,
      );

      globe.destroy();

      globeRef.current = null;
    };
  }, []);

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    pointerDownRef.current =
      event.clientX;

    dragRef.current = 0;

    event.currentTarget.setPointerCapture(
      event.pointerId,
    );
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (
      pointerDownRef.current === null
    ) {
      return;
    }

    const delta =
      event.clientX -
      pointerDownRef.current;

    dragRef.current =
      delta / 250;
  };

  const handlePointerEnd = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (
      pointerDownRef.current === null
    ) {
      return;
    }

    rotationRef.current +=
      dragRef.current;

    dragRef.current = 0;

    pointerDownRef.current = null;

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId,
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      );
    }
  };

  return (
    <div
      className="
        pointer-events-none
        absolute
        inset-0
      "
    >
      {/* globe glow */}

      <div
        aria-hidden
        className="
          absolute

          left-1/2
          top-[52%]

          size-[320px]

          -translate-x-1/2
          -translate-y-1/2

          rounded-full

          bg-[#d1ff46]/[0.06]

          blur-[80px]

          sm:size-[580px]
          sm:blur-[110px]
        "
      />

      {/* =====================================
          GLOBE WRAPPER

          MOBILE:
          360px, centered.

          TABLET:
          590px.

          DESKTOP:
          700px.
      ====================================== */}

      <div
        ref={wrapperRef}
        onPointerDown={
          handlePointerDown
        }
        onPointerMove={
          handlePointerMove
        }
        onPointerUp={
          handlePointerEnd
        }
        onPointerCancel={
          handlePointerEnd
        }
        className="
          pointer-events-auto

          absolute

          left-1/2
          top-[51%]

          size-[355px]

          -translate-x-1/2
          -translate-y-1/2

          cursor-grab

          touch-none
          select-none

          active:cursor-grabbing

          sm:top-[53%]
          sm:size-[590px]

          lg:size-[700px]
        "
      >
        {/* actual globe */}

        <canvas
          ref={canvasRef}
          style={{
            WebkitMaskImage: `
              radial-gradient(
                circle at 50% 48%,
                black 0%,
                black 67%,
                rgba(0,0,0,.93) 75%,
                rgba(0,0,0,.48) 88%,
                transparent 100%
              )
            `,

            maskImage: `
              radial-gradient(
                circle at 50% 48%,
                black 0%,
                black 67%,
                rgba(0,0,0,.93) 75%,
                rgba(0,0,0,.48) 88%,
                transparent 100%
              )
            `,
          }}
          className="
            block
            size-full

            opacity-0

            transition-opacity
            duration-1000
            ease-out
          "
        />

        {/* =====================================
            LOCATION LABELS
        ====================================== */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            z-20
          "
        >
          {CDN_NODES.map(
            (node) => (
              <GlobeLabel
                key={node.id}
                node={node}
                active={
                  activeNode ===
                  node.id
                }
                onClick={() =>
                  setActiveNode(
                    node.id,
                  )
                }
              />
            ),
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   GLOBE LABEL
========================================================= */

type AnchorStyle =
  React.CSSProperties & {
    positionAnchor: string;
  };

function GlobeLabel({
  node,
  active,
  onClick,
}: {
  node: NodeLocation;
  active: boolean;
  onClick: () => void;
}) {
  const visibilityVariable =
    `var(--cobe-visible-${node.id}, 0)`;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();

        onClick();
      }}
      style={
        {
          positionAnchor:
            `--cobe-${node.id}`,

          /*
           * Anchor the label directly
           * above Cobe's marker.
           */
          left: "anchor(center)",

          bottom: "anchor(top)",

          opacity:
            visibilityVariable,
        } as AnchorStyle
      }
      className={`
        pointer-events-auto

        absolute

        -translate-x-1/2
        -translate-y-2

        whitespace-nowrap

        rounded-lg

        border

        px-2
        py-1.5

        shadow-[0_8px_24px_-14px_rgba(0,0,0,.28)]

        backdrop-blur-xl

        transition-[background-color,border-color,color,transform]
        duration-200

        ${
          active
            ? `
              z-30

              border-neutral-900

              bg-neutral-950

              text-white

              -translate-y-2.5
            `
            : `
              z-20

              border-black/[0.07]

              bg-background/75

              text-neutral-700

              hover:border-black/[0.12]
              hover:bg-background/95
            `
        }
      `}
    >
      <div
        className="
          flex
          items-center
          gap-1.5
        "
      >
        <span
          className={`
            size-1.5
            rounded-full

            ${
              active
                ? "bg-[#d1ff46]"
                : "bg-neutral-400"
            }
          `}
        />

        <span
          className="
            text-[9px]
            font-semibold

            sm:text-[10px]
          "
        >
          {node.city}
        </span>

        {/* hide extra info on phones */}
        <span
          className={`
            hidden

            text-[8px]
            font-bold

            sm:inline

            ${
              active
                ? "text-[#d1ff46]"
                : "text-neutral-400"
            }
          `}
        >
          {node.latency}
        </span>
      </div>
    </button>
  );
}