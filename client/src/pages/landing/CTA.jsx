// import { useEffect, useRef } from 'react';
// import useScrollReveal from './useScrollReveal';

// export default function CTA({ onLogin, onRegister }) {
//   const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.15 });

//   const canvasRef = useRef(null);
//   const spiderRef = useRef(null);
//   const sectionElementRef = useRef(null);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');
//     const spider = spiderRef.current;
//     const section = sectionElementRef.current;

//     const SETTINGS = {
//       spacing: 52,
//       dotRadius: 0.85,
//       dotOpacity: 0.50,

//       spiderRadius: 225,
//       maxConnections: 12,

//       movementSpeed: 0.22,
//       directionChangeSpeed: 0.004,
//       directionSmoothness: 0.020,
//       maxVelocity: 0.90,

//       displacement: 9,
//       spring: 0.024,
//       friction: 0.87,

//       lineWidth: 0.7,
//       lineColor: "255, 58, 32",
//       maxLineAlpha: 0.72
//     };

//     let width = 0;
//     let height = 0;
//     let dpr = 1;
//     let dots = [];
//     let animationId;

//     const spiderPosition = {
//       x: 0,
//       y: 0,

//       vx: 0,
//       vy: 0,

//       directionX: 1,
//       directionY: 0,

//       targetDirectionX: 1,
//       targetDirectionY: 0
//     };

//     /* =========================================================
//        RESIZE
//     ========================================================= */

//     function resize() {
//       dpr = Math.min(
//         window.devicePixelRatio || 1,
//         2
//       );

//       const rect =
//         section.getBoundingClientRect();

//       width = rect.width;
//       height = rect.height;

//       canvas.width =
//         width * dpr;

//       canvas.height =
//         height * dpr;

//       canvas.style.width =
//         width + "px";

//       canvas.style.height =
//         height + "px";

//       ctx.setTransform(
//         dpr,
//         0,
//         0,
//         dpr,
//         0,
//         0
//       );

//       if (
//         spiderPosition.x === 0 &&
//         spiderPosition.y === 0
//       ) {
//         spiderPosition.x =
//           width * 0.5;

//         spiderPosition.y =
//           height * 0.52;
//       }

//       createDots();
//     }

//     /* =========================================================
//        CREATE DOT GRID
//     ========================================================= */

//     function createDots() {
//       dots = [];

//       const spacing =
//         SETTINGS.spacing;

//       for (
//         let x = spacing / 2;
//         x < width;
//         x += spacing
//       ) {
//         for (
//           let y = spacing / 2;
//           y < height;
//           y += spacing
//         ) {
//           const random =
//             Math.abs(
//               Math.sin(
//                 x * 12.9898 +
//                 y * 78.233
//               )
//             );

//           dots.push({
//             ox: x,
//             oy: y,

//             x: x,
//             y: y,

//             vx: 0,
//             vy: 0,

//             alpha:
//               SETTINGS.dotOpacity *
//               (
//                 0.65 +
//                 random * 0.35
//               ),

//             phase:
//               random *
//               Math.PI *
//               2
//           });
//         }
//       }
//     }

//     /* =========================================================
//        CHOOSE RANDOM DIRECTION
//     ========================================================= */

//     function chooseNewDirection() {
//       const angle =
//         Math.random() *
//         Math.PI *
//         2;

//       spiderPosition.targetDirectionX =
//         Math.cos(angle);

//       spiderPosition.targetDirectionY =
//         Math.sin(angle);
//     }

//     /* =========================================================
//        SPIDER MOVEMENT
//     ========================================================= */

//     function updateSpiderMovement() {
//       if (
//         Math.random() <
//         SETTINGS.directionChangeSpeed
//       ) {
//         chooseNewDirection();
//       }

//       spiderPosition.directionX +=
//         (
//           spiderPosition.targetDirectionX -
//           spiderPosition.directionX
//         ) *
//         SETTINGS.directionSmoothness;

//       spiderPosition.directionY +=
//         (
//           spiderPosition.targetDirectionY -
//           spiderPosition.directionY
//         ) *
//         SETTINGS.directionSmoothness;

//       const directionLength =
//         Math.sqrt(
//           spiderPosition.directionX *
//             spiderPosition.directionX +
//           spiderPosition.directionY *
//             spiderPosition.directionY
//         );

//       if (
//         directionLength > 0
//       ) {
//         spiderPosition.directionX /=
//           directionLength;

//         spiderPosition.directionY /=
//           directionLength;
//       }

//       spiderPosition.vx +=
//         spiderPosition.directionX *
//         SETTINGS.movementSpeed *
//         0.07;

//       spiderPosition.vy +=
//         spiderPosition.directionY *
//         SETTINGS.movementSpeed *
//         0.07;

//       spiderPosition.vx *= 0.986;
//       spiderPosition.vy *= 0.986;

//       const velocity =
//         Math.sqrt(
//           spiderPosition.vx *
//             spiderPosition.vx +
//           spiderPosition.vy *
//             spiderPosition.vy
//         );

//       if (
//         velocity >
//         SETTINGS.maxVelocity
//       ) {
//         spiderPosition.vx =
//           (
//             spiderPosition.vx /
//             velocity
//           ) *
//           SETTINGS.maxVelocity;

//         spiderPosition.vy =
//           (
//             spiderPosition.vy /
//             velocity
//           ) *
//           SETTINGS.maxVelocity;
//       }

//       spiderPosition.x +=
//         spiderPosition.vx;

//       spiderPosition.y +=
//         spiderPosition.vy;

//       /* =====================================================
//          BOUNDARIES ARE CTA BOUNDARIES
//       ===================================================== */

//       const margin = 100;

//       if (
//         spiderPosition.x <
//         margin
//       ) {
//         spiderPosition.x =
//           margin;

//         spiderPosition.targetDirectionX =
//           Math.abs(
//             spiderPosition.targetDirectionX
//           );
//       }

//       if (
//         spiderPosition.x >
//         width - margin
//       ) {
//         spiderPosition.x =
//           width - margin;

//         spiderPosition.targetDirectionX =
//           -Math.abs(
//             spiderPosition.targetDirectionX
//           );
//       }

//       if (
//         spiderPosition.y <
//         margin
//       ) {
//         spiderPosition.y =
//           margin;

//         spiderPosition.targetDirectionY =
//           Math.abs(
//             spiderPosition.targetDirectionY
//           );
//       }

//       if (
//         spiderPosition.y >
//         height - margin
//       ) {
//         spiderPosition.y =
//           height - margin;

//         spiderPosition.targetDirectionY =
//           -Math.abs(
//             spiderPosition.targetDirectionY
//           );
//       }

//       /* =====================================================
//          LOGO
//       ===================================================== */

//       spider.style.left =
//         spiderPosition.x + "px";

//       spider.style.top =
//         spiderPosition.y + "px";

//       const rotation =
//         spiderPosition.vx * 1.2;

//       spider.style.transform =
//         `
//         translate(-50%, -50%)
//         rotate(${rotation}deg)
//         `;
//     }

//     /* =========================================================
//        DOT PHYSICS
//     ========================================================= */

//     function updateDots(time) {
//       dots.forEach(dot => {
//         const dx =
//           dot.x -
//           spiderPosition.x;

//         const dy =
//           dot.y -
//           spiderPosition.y;

//         const distance =
//           Math.sqrt(
//             dx * dx +
//             dy * dy
//           );

//         if (
//           distance <
//           SETTINGS.spiderRadius
//         ) {
//           let nx = 0;
//           let ny = 0;

//           if (
//             distance >
//             0.001
//           ) {
//             nx =
//               dx /
//               distance;

//             ny =
//               dy /
//               distance;
//           }

//           const influence =
//             1 -
//             distance /
//             SETTINGS.spiderRadius;

//           const force =
//             influence *
//             influence *
//             SETTINGS.displacement;

//           dot.vx +=
//             nx *
//             force *
//             0.032;

//           dot.vy +=
//             ny *
//             force *
//             0.032;

//           dot.vx +=
//             spiderPosition.vx *
//             influence *
//             0.018;

//           dot.vy +=
//             spiderPosition.vy *
//             influence *
//             0.018;
//         }

//         dot.vx +=
//           (
//             dot.ox -
//             dot.x
//           ) *
//           SETTINGS.spring;

//         dot.vy +=
//           (
//             dot.oy -
//             dot.y
//           ) *
//           SETTINGS.spring;

//         dot.vx *=
//           SETTINGS.friction;

//         dot.vy *=
//           SETTINGS.friction;

//         dot.x += dot.vx;
//         dot.y += dot.vy;

//         dot.x +=
//           Math.sin(
//             time * 0.00025 +
//             dot.phase
//           ) *
//           0.025;

//         dot.y +=
//           Math.cos(
//             time * 0.00025 +
//             dot.phase
//           ) *
//           0.025;
//       });
//     }

//     /* =========================================================
//        NEAREST DOTS
//     ========================================================= */

//     function getNearestDots() {
//       const nearby = [];

//       dots.forEach(dot => {
//         const dx =
//           dot.x -
//           spiderPosition.x;

//         const dy =
//           dot.y -
//           spiderPosition.y;

//         const distance =
//           Math.sqrt(
//             dx * dx +
//             dy * dy
//           );

//         if (
//           distance <
//           SETTINGS.spiderRadius
//         ) {
//           nearby.push({
//             dot,
//             distance
//           });
//         }
//       });

//       nearby.sort(
//         (a, b) =>
//           a.distance -
//           b.distance
//       );

//       return nearby.slice(
//         0,
//         SETTINGS.maxConnections
//       );
//     }

//     /* =========================================================
//        DRAW DOTS
//     ========================================================= */

//     function drawDots() {
//       dots.forEach(dot => {
//         ctx.beginPath();

//         ctx.arc(
//           dot.x,
//           dot.y,
//           SETTINGS.dotRadius,
//           0,
//           Math.PI * 2
//         );

//         ctx.fillStyle =
//           `rgba(
//             255,
//             255,
//             255,
//             ${dot.alpha}
//           )`;

//         ctx.fill();
//       });
//     }

//     /* =========================================================
//        DRAW CONNECTIONS
//     ========================================================= */

//     function drawSpiderConnections() {
//       const nearby =
//         getNearestDots();

//       nearby.forEach(
//         ({ dot, distance }) => {

//           const influence =
//             1 -
//             distance /
//             SETTINGS.spiderRadius;

//           const alpha =
//             Math.pow(
//               influence,
//               1.65
//             ) *
//             SETTINGS.maxLineAlpha;

//           if (
//             alpha <= 0
//           ) {
//             return;
//           }

//           /* EXACTLY ONE LINE */

//           ctx.beginPath();

//           ctx.moveTo(
//             spiderPosition.x,
//             spiderPosition.y
//           );

//           ctx.lineTo(
//             dot.x,
//             dot.y
//           );

//           ctx.strokeStyle =
//             `rgba(
//               ${SETTINGS.lineColor},
//               ${alpha}
//             )`;

//           ctx.lineWidth =
//             SETTINGS.lineWidth;

//           ctx.lineCap =
//             "round";

//           ctx.stroke();

//           /* END DOT */

//           ctx.beginPath();

//           ctx.arc(
//             dot.x,
//             dot.y,
//             1.15 +
//               influence * 0.7,
//             0,
//             Math.PI * 2
//           );

//           ctx.fillStyle =
//             `rgba(
//               255,
//               255,
//               255,
//               ${Math.min(
//                 0.9,
//                 dot.alpha +
//                   influence * 0.25
//               )}
//             )`;

//           ctx.fill();
//         }
//       );
//     }

//     /* =========================================================
//        AURA
//     ========================================================= */

//     function drawAura() {
//       const gradient =
//         ctx.createRadialGradient(
//           spiderPosition.x,
//           spiderPosition.y,
//           0,
//           spiderPosition.x,
//           spiderPosition.y,
//           85
//         );

//       gradient.addColorStop(
//         0,
//         "rgba(255,55,25,.08)"
//       );

//       gradient.addColorStop(
//         0.35,
//         "rgba(255,55,25,.025)"
//       );

//       gradient.addColorStop(
//         1,
//         "rgba(255,55,25,0)"
//       );

//       ctx.beginPath();

//       ctx.arc(
//         spiderPosition.x,
//         spiderPosition.y,
//         85,
//         0,
//         Math.PI * 2
//       );

//       ctx.fillStyle =
//         gradient;

//       ctx.fill();
//     }

//     /* =========================================================
//        ANIMATION
//     ========================================================= */

//     function animate(time) {
//       ctx.clearRect(
//         0,
//         0,
//         width,
//         height
//       );

//       updateSpiderMovement();

//       updateDots(time);

//       drawAura();

//       drawDots();

//       drawSpiderConnections();

//       animationId =
//         requestAnimationFrame(
//           animate
//         );
//     }

//     /* =========================================================
//        START
//     ========================================================= */

//     resize();

//     chooseNewDirection();

//     animate(0);

//     window.addEventListener(
//       "resize",
//       resize
//     );

//     return () => {
//       cancelAnimationFrame(
//         animationId
//       );

//       window.removeEventListener(
//         "resize",
//         resize
//       );
//     };
//   }, []);

//   return (
//     <section
//       id="cta"
//       ref={(el) => {
//         sectionRef.current = el;
//         sectionElementRef.current = el;
//       }}
//       className="
//         relative
//         h-[600px]
//         w-full
//         overflow-hidden
//         bg-black
//         border-t
//         border-white/[0.06]
//       "
//     >

//       {/* ================================================
//           SPIDER CANVAS
//           ONLY EXISTS INSIDE CTA
//       ================================================= */}

//       <canvas
//         ref={canvasRef}
//         className="
//           absolute
//           inset-0
//           w-full
//           h-full
//           block
//           bg-black
//         "
//       />

//       {/* ================================================
//           LOGO
//       ================================================= */}

//       <div
//         ref={spiderRef}
//         className="
//           absolute
//           z-20
//           w-[76px]
//           h-[76px]
//           pointer-events-none
//           will-change-[left,top,transform]
//           max-[700px]:w-[60px]
//           max-[700px]:h-[60px]
//         "
//         style={{
//           filter: `
//             drop-shadow(
//               0 0 8px
//               rgba(255,55,30,0.28)
//             )
//             drop-shadow(
//               0 0 25px
//               rgba(255,55,30,0.12)
//             )
//           `
//         }}
//       >
//         <img
//           src="/careerodyssey-logo.png"
//           alt="CareerOdyssey"
//           className="
//             w-full
//             h-full
//             object-contain
//             block
//             pointer-events-none
//             select-none
//           "
//           draggable="false"
//         />
//       </div>

//       {/* ================================================
//           ONLY TWO BUTTONS
//       ================================================= */}

//       <div
//         className={`
//           absolute
//           bottom-10
//           left-1/2
//           -translate-x-1/2
//           z-30
//           flex
//           flex-wrap
//           items-center
//           justify-center
//           gap-4
//           transition-all
//           duration-700
//           ${
//             isRevealed
//               ? 'opacity-100 translate-y-0'
//               : 'opacity-0 translate-y-4'
//           }
//         `}
//       >

//         <button
//           type="button"
//           onClick={() =>
//             onRegister &&
//             onRegister('student')
//           }
//           className="
//             px-8
//             py-3.5
//             text-sm
//             font-semibold
//             text-white
//             bg-gradient-to-r
//             from-[#fc8200]
//             to-[#ff4d00]
//             hover:from-[#ff9326]
//             hover:to-[#ff5e1a]
//             rounded-xl
//             shadow-xl
//             shadow-[#fc8200]/25
//             hover:shadow-[#fc8200]/40
//             transition-all
//             duration-300
//             flex
//             items-center
//             gap-2
//             cursor-pointer
//             active:scale-95
//           "
//         >
//           <span>
//             Get Started Free
//           </span>

//           <span className="material-symbols-outlined text-base">
//             rocket_launch
//           </span>
//         </button>

//         <button
//           type="button"
//           onClick={onLogin}
//           className="
//             px-6
//             py-3.5
//             text-sm
//             font-medium
//             text-zinc-300
//             hover:text-white
//             bg-[#131415]
//             hover:bg-[#1a1a1e]
//             border
//             border-white/10
//             hover:border-white/20
//             rounded-xl
//             transition-all
//             duration-200
//             cursor-pointer
//           "
//         >
//           Log In to Account
//         </button>

//       </div>

//     </section>
//   );
// }




import { useEffect, useRef } from 'react';
import useScrollReveal from './useScrollReveal';
import logo from '../../assets/images/logo co.png';

export default function CTA({ onLogin, onRegister }) {
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.15 });

  const canvasRef = useRef(null);
  const spiderRef = useRef(null);
  const sectionElementRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const spider = spiderRef.current;
    const section = sectionElementRef.current;

    if (!canvas || !spider || !section) return;

    const SETTINGS = {
      spacing: 52,
      dotRadius: 0.85,
      dotOpacity: 0.50,

      spiderRadius: 225,
      maxConnections: 12,

      movementSpeed: 0.22,
      directionChangeSpeed: 0.004,
      directionSmoothness: 0.020,
      maxVelocity: 0.90,

      displacement: 9,
      spring: 0.024,
      friction: 0.87,

      lineWidth: 0.7,
      lineColor: "255, 58, 32",
      maxLineAlpha: 0.72
    };

    let width = 0;
    let height = 0;
    let dpr = 1;
    let dots = [];
    let animationId;

    const spiderPosition = {
      x: 0,
      y: 0,

      vx: 0,
      vy: 0,

      directionX: 1,
      directionY: 0,

      targetDirectionX: 1,
      targetDirectionY: 0
    };

    /* =========================================================
       POINTER / TOUCH INTERACTION
       Normal autonomous movement stays unchanged.
       Near pointer/touch: pause -> glow -> fast movement.
    ========================================================= */

    const interaction = {
      phase: "normal",
      until: 0,
      pointerNear: false,
      lastPointer: null
    };

    const INTERACTION = {
      triggerRadius: 105,
      pauseDuration: 520,
      fastDuration: 5000,
      fastMultiplier: 4.8,
      glowMultiplier: 2.8,
      glowBlur: 16,
      glowWidth: 1.45,
      exitMargin: 90
    };

    function triggerSpiderInteraction() {
      if (interaction.phase !== "normal") return;

      interaction.phase = "pause";
      interaction.until = performance.now() + INTERACTION.pauseDuration;
      spiderPosition.vx = 0;
      spiderPosition.vy = 0;

      // After the short pause, launch the spider away from the pointer.
      const lastPointer = interaction.lastPointer;
      if (lastPointer) {
        const dx = spiderPosition.x - lastPointer.x;
        const dy = spiderPosition.y - lastPointer.y;
        const length = Math.sqrt(dx * dx + dy * dy) || 1;
        spiderPosition.directionX = dx / length;
        spiderPosition.directionY = dy / length;
        spiderPosition.targetDirectionX = dx / length;
        spiderPosition.targetDirectionY = dy / length;
      }
    }

    function updateInteraction(time) {
      if (interaction.phase === "pause" && time >= interaction.until) {
        interaction.phase = "fast";
        interaction.until = time + INTERACTION.fastDuration;
      } else if (interaction.phase === "fast" && time >= interaction.until) {
        interaction.phase = "normal";
      }
    }

    function handlePointerPosition(clientX, clientY) {
      const rect = section.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const dx = px - spiderPosition.x;
      const dy = py - spiderPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      interaction.lastPointer = { x: px, y: py };
      const near = distance <= INTERACTION.triggerRadius;

      if (near && !interaction.pointerNear) {
        triggerSpiderInteraction();
      }
      interaction.pointerNear = near;
    }

    /* =========================================================
       RESIZE
    ========================================================= */

    function resize() {
      dpr = Math.min(
        window.devicePixelRatio || 1,
        2
      );

      const rect = section.getBoundingClientRect();

      width = rect.width;
      height = rect.height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      canvas.style.width = width + "px";
      canvas.style.height = height + "px";

      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      );

      if (
        spiderPosition.x === 0 &&
        spiderPosition.y === 0
      ) {
        spiderPosition.x = width * 0.5;
        spiderPosition.y = height * 0.52;
      }

      createDots();
    }

    /* =========================================================
       CREATE DOT GRID
    ========================================================= */

    function createDots() {
      dots = [];

      const spacing = SETTINGS.spacing;

      for (
        let x = spacing / 2;
        x < width;
        x += spacing
      ) {
        for (
          let y = spacing / 2;
          y < height;
          y += spacing
        ) {
          const random = Math.abs(
            Math.sin(
              x * 12.9898 +
              y * 78.233
            )
          );

          dots.push({
            ox: x,
            oy: y,

            x: x,
            y: y,

            vx: 0,
            vy: 0,

            alpha:
              SETTINGS.dotOpacity *
              (
                0.65 +
                random * 0.35
              ),

            phase:
              random *
              Math.PI *
              2
          });
        }
      }
    }

    /* =========================================================
       CHOOSE RANDOM DIRECTION
    ========================================================= */

    function chooseNewDirection() {
      const angle =
        Math.random() *
        Math.PI *
        2;

      spiderPosition.targetDirectionX =
        Math.cos(angle);

      spiderPosition.targetDirectionY =
        Math.sin(angle);
    }

    /* =========================================================
       AUTONOMOUS SPIDER MOVEMENT
    ========================================================= */

    function respawnFromRandomSide() {
      const side = Math.floor(Math.random() * 4);
      const padding = 55;
      let x;
      let y;
      let angle;

      if (side === 0) {
        // Top
        x = padding + Math.random() * Math.max(1, width - padding * 2);
        y = -INTERACTION.exitMargin;
        angle = Math.PI / 2 + (Math.random() - 0.5) * 0.9;
      } else if (side === 1) {
        // Right
        x = width + INTERACTION.exitMargin;
        y = padding + Math.random() * Math.max(1, height - padding * 2);
        angle = Math.PI + (Math.random() - 0.5) * 0.9;
      } else if (side === 2) {
        // Bottom
        x = padding + Math.random() * Math.max(1, width - padding * 2);
        y = height + INTERACTION.exitMargin;
        angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.9;
      } else {
        // Left
        x = -INTERACTION.exitMargin;
        y = padding + Math.random() * Math.max(1, height - padding * 2);
        angle = (Math.random() - 0.5) * 0.9;
      }

      spiderPosition.x = x;
      spiderPosition.y = y;
      spiderPosition.vx = 0;
      spiderPosition.vy = 0;
      spiderPosition.directionX = Math.cos(angle);
      spiderPosition.directionY = Math.sin(angle);
      spiderPosition.targetDirectionX = spiderPosition.directionX;
      spiderPosition.targetDirectionY = spiderPosition.directionY;

      // Keep the fast state briefly so the spider visibly enters from
      // the newly selected side before returning to normal movement.
      interaction.phase = "fast";
      interaction.until = performance.now() + 900;
    }

    function updateSpiderMovement(time) {
      if (interaction.phase === "pause") {
        spiderPosition.vx = 0;
        spiderPosition.vy = 0;
        spider.style.transform = `
          translate(-50%, -50%)
          rotate(0deg)
        `;
        return;
      }

      const speedMultiplier =
        interaction.phase === "fast"
          ? INTERACTION.fastMultiplier
          : 1;

      // During the fast escape the spider keeps its launch direction
      // so it actually shoots out of the CTA instead of turning back.
      if (interaction.phase !== "fast" &&
        Math.random() < SETTINGS.directionChangeSpeed
      ) {
        chooseNewDirection();
      }

      spiderPosition.directionX +=
        (
          spiderPosition.targetDirectionX -
          spiderPosition.directionX
        ) *
        SETTINGS.directionSmoothness;

      spiderPosition.directionY +=
        (
          spiderPosition.targetDirectionY -
          spiderPosition.directionY
        ) *
        SETTINGS.directionSmoothness;

      const directionLength =
        Math.sqrt(
          spiderPosition.directionX *
            spiderPosition.directionX +
          spiderPosition.directionY *
            spiderPosition.directionY
        );

      if (directionLength > 0) {
        spiderPosition.directionX /=
          directionLength;

        spiderPosition.directionY /=
          directionLength;
      }

      spiderPosition.vx +=
        spiderPosition.directionX *
        SETTINGS.movementSpeed *
        0.07 *
        speedMultiplier;

      spiderPosition.vy +=
        spiderPosition.directionY *
        SETTINGS.movementSpeed *
        0.07 *
        speedMultiplier;

      spiderPosition.vx *= 0.986;
      spiderPosition.vy *= 0.986;

      const velocity =
        Math.sqrt(
          spiderPosition.vx *
            spiderPosition.vx +
          spiderPosition.vy *
            spiderPosition.vy
        );

      const velocityLimit =
        interaction.phase === "fast"
          ? SETTINGS.maxVelocity * 3.8
          : SETTINGS.maxVelocity;

      if (velocity > velocityLimit) {
        spiderPosition.vx =
          (spiderPosition.vx / velocity) * velocityLimit;

        spiderPosition.vy =
          (spiderPosition.vy / velocity) * velocityLimit;
      }

      spiderPosition.x +=
        spiderPosition.vx;

      spiderPosition.y +=
        spiderPosition.vy;

      /* CTA SECTION BOUNDARIES / FAST EXIT */

      if (interaction.phase === "fast") {
        const exit = INTERACTION.exitMargin;
        const outside =
          spiderPosition.x < -exit ||
          spiderPosition.x > width + exit ||
          spiderPosition.y < -exit ||
          spiderPosition.y > height + exit;

        if (outside) {
          respawnFromRandomSide();
        }
      } else {
        const margin = 100;

        if (spiderPosition.x < margin) {
          spiderPosition.x = margin;
          spiderPosition.targetDirectionX = Math.abs(spiderPosition.targetDirectionX);
        }

        if (spiderPosition.x > width - margin) {
          spiderPosition.x = width - margin;
          spiderPosition.targetDirectionX = -Math.abs(spiderPosition.targetDirectionX);
        }

        if (spiderPosition.y < margin) {
          spiderPosition.y = margin;
          spiderPosition.targetDirectionY = Math.abs(spiderPosition.targetDirectionY);
        }

        if (spiderPosition.y > height - margin) {
          spiderPosition.y = height - margin;
          spiderPosition.targetDirectionY = -Math.abs(spiderPosition.targetDirectionY);
        }
      }

      /* LOGO POSITION */

      spider.style.left =
        spiderPosition.x + "px";

      spider.style.top =
        spiderPosition.y + "px";

      const rotation =
        spiderPosition.vx * 1.2;

      spider.style.transform = `
        translate(-50%, -50%)
        rotate(${rotation}deg)
      `;
    }