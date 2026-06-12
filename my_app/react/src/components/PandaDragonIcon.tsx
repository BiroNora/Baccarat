import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface PandaDragonIconProps {
  width?: number;
  faceColor?: string;
}

const PandaDragonIcon: React.FC<PandaDragonIconProps> = ({
  width = 150,
  faceColor,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const svgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 },
    );

    if (svgRef.current) {
      observer.observe(svgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const finalFaceColor = faceColor || "transparent";

  const baseProps = {
    initial: { rotateY: 0, opacity: 0 },
    animate: { rotateY: 720, opacity: 1 },
    transition: { duration: 3, ease: "backOut" }, // repeat: 1 = összesen 2-szer fordul
  } as const;

  return (
    <div style={{ perspective: "1000px" }}>
      <motion.svg
        {...baseProps}
        viewBox="0 0 500 500"
        width={width}
        height={width}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animated-panda"
        style={{
          transformOrigin: "center center",
          overflow: "visible",
        }}
      >
        <g className={isVisible ? "start-animate" : "hidden"}>
          <path
            style={{ fill: "rgb(153, 82, 16)" }}
            d="M 446.013 186.551 C 311.633 133.004 49.342 392.987 286.29 395.854 L 263.598 364.237 C 328.207 288.786 387.615 347.175 294.147 455.926 C 288.861 456.889 286.462 479.156 279.509 494.755 C 272.175 511.206 484.682 494.102 453.57 504.649 C 383.853 458.238 419.997 426.801 429.43 373.722 L 450.376 373.09 C 455.361 362.882 447.113 280.238 381.427 223.226 C 402.995 193.144 445.562 185.938 446.013 186.551 Z"
          />
          <path
            style={{ fill: "rgb(57, 255, 20)" }}
            d="M 326.576 239.098 C 330.9 270.891 275.257 315.76 270.282 279.169 C 264.257 263.609 320.968 224.612 326.576 239.098 Z"
          />
          <path
            style={{ fill: "rgb(122, 42, 171)" }}
            d="M 333.632 156.008 C 313.311 191.846 177.425 248.938 93.471 159.968 C 7.693 276.554 61.9 384.838 132.598 379.724 C 197.011 384.753 211.457 333.677 148.113 322.31 C 79.537 255.207 325.752 256.884 333.632 156.008 Z"
          />
          <path
            style={{ fill: finalFaceColor }}
            d="M 92.801 160.714 C 84.495 -57.527 364.484 -1.613 333.636 155.434 C 318.936 194.81 170.643 248.213 92.801 160.713"
          />
          <path
            style={{ fill: "rgb(122, 42, 171)" }}
            d="M 162.96 129.532 C 89.67 131.185 166.639 24.129 183.198 97.855"
          />
          <path
            style={{ fill: "rgb(122, 42, 171)" }}
            d="M 239.866 97.855 C 252.654 20.584 327.424 116.493 262.803 132.172"
          />
          <path
            style={{ fill: "rgb(122, 42, 171)" }}
            d="M 206.81 132.832 L 193.636 128.157 C 187.782 118.416 217.97 96.661 228.491 126.232 L 216.516 132.428 L 214.905 163.188 L 208.834 163.848 L 206.81 132.832 Z"
          />
          <path
            style={{ fill: "rgb(122, 42, 171)" }}
            d="M 112.608 68.556 C 68.248 59.161 102.232 -23.865 147.743 31.892"
          />
          <path
            style={{ fill: "rgb(122, 42, 171)" }}
            d="M 277.511 36.476 C 291.196 -12.468 360.429 24.418 315.458 69.93"
          />
        </g>
      </motion.svg>
    </div>
  );
};

export default PandaDragonIcon;
