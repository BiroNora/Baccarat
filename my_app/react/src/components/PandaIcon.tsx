import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface PandaIconProps {
  width?: number;
  faceColor?: string;
}

const PandaIcon: React.FC<PandaIconProps> = ({ width = 150, faceColor }) => {
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
  const purpleStyle = { fill: "rgb(122, 42, 171)" };

  const details = [
    "M 396.47 222.663 C 372.343 266.159 211.006 335.452 111.328 227.469 C 9.484 368.97 73.844 500.396 157.784 494.189 C 234.261 500.292 266.631 432.695 191.423 418.899 C 110.264 337.226 402.305 311.433 312.369 419.7 C 210.061 444.378 305.749 503.025 336.398 495.791 C 460.946 491.002 480.838 351.489 396.47 222.663 Z",
    "M 193.832 190.528 C 106.815 192.535 198.2 62.6 217.861 152.082",
    "M 285.142 152.082 C 300.325 58.297 389.099 174.703 312.375 193.732",
    "M 245.895 194.533 L 230.254 188.859 C 223.303 177.037 257.476 153.414 274.418 187.079 L 257.419 194.043 L 255.506 231.377 L 248.298 232.178 L 245.895 194.533 Z",
    "M 134.049 116.521 C 81.381 105.119 121.73 4.349 175.765 72.022",
    "M 329.838 77.585 C 346.086 18.182 428.286 62.951 374.892 118.189",
  ];

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
            style={{ fill: finalFaceColor }}
            d="M 110.533 228.374 C 100.671 -36.507 429.896 30.556 396.475 222.767 C 381.425 263.349 202.954 335.373 110.533 229.174"
          />

          {details.map((d, index) => (
            <path key={index} style={purpleStyle} d={d} />
          ))}
        </g>
      </motion.svg>
    </div>
  );
};

export default PandaIcon;
