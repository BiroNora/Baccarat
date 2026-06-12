import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const DragonIcon = ({ width = 150 }) => {
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
        viewBox="0 0 500 500"
        width={width}
        height={width}
        className="animated-dragon"
      >
        <g className={isVisible ? "start-animate" : "hidden"}>
          <path
            style={{
              fill: "rgb(153, 82, 16)",
            }}
            d="M 478.966 15.718 C 232.324 -52.107 -249.087 277.206 185.815 280.836 L 144.165 240.788 C 262.743 145.218 371.782 219.177 200.232 356.927 C 170.285 360.696 80.751 470.117 108.122 498.697 L 426.904 499.498 C 445.396 508.744 514.791 401.671 498.189 395.373 C 511.524 419.206 342.923 486.994 333.192 474.668 C 285.062 448.774 462.156 344.06 448.53 252.802 L 486.976 252.001 C 496.126 239.072 480.985 134.389 360.424 62.174 C 400.011 24.069 478.14 14.941 478.966 15.718 Z"
          />

          <path
            style={{
              fill: "rgb(57, 255, 20)",
            }}
            d="M 268.313 80.095 C 276.249 120.767 174.123 178.167 164.989 131.357 C 153.931 111.452 258.018 61.564 268.313 80.095 Z"
          />
        </g>
      </motion.svg>
    </div>
  );
};

export default DragonIcon;
