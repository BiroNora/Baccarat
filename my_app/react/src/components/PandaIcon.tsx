import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const PandaIcon = ({ width = 150, color = "#7a2aab" }) => {
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

  const baseProps = {
    initial: { rotateY: 0, opacity: 0 },
    animate: { rotateY: 720, opacity: 1 },
    transition: { duration: 3, ease: "backOut" }, // repeat: 1 = összesen 2-szer fordul
  } as const;

  return (
    <div style={{ perspective: "1000px" }}>
      <motion.svg
        {...baseProps}
        viewBox="-40 0 500 500"
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
            style={{ fill: color }}
            d={`
              M 349.213 225.066 C 329.091 266.96 167.754 335.452 68.076 227.469 C -33.768 368.97 30.592 500.396 114.532 494.189 C 191.009 500.292 223.379 432.695 148.171 418.899 C 67.012 337.226 359.053 311.433 269.117 419.7 C 166.809 444.378 262.497 503.025 293.146 495.791 C 417.694 491.002 433.581 353.892 349.213 225.066 Z
              M 80.09 118.238 C 27.816 66.256 114.411 23.124 128.148 75.787 C 123.537 84.779 109.819 71.638 81.692 117.437
              M 80.09 118.238 C 27.816 66.256 114.411 23.124 128.148 75.787 C 123.537 84.779 109.819 71.638 81.692 117.437
              M 289.14 81.394 C 281.983 25.871 396.3 57.742 333.193 117.437
              M 146.57 194.33 C 59.314 186.192 163.214 64.692 174.603 157.485
              M 240.282 155.083 C 253.62 65.847 352.584 187.327 267.515 196.733
              M 202.637 198.334 L 187.419 194.33 C 183.803 162.991 249.457 182.583 229.87 192.728 C 210.283 202.873 212.398 200.357 213.049 200.737 L 213.049 231.975 L 202.637 233.577
            `}
          />
        </g>
      </motion.svg>
    </div>
  );
};

export default PandaIcon;
