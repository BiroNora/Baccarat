import { useEffect, useRef, useState } from "react";
import "../styles/shoe.css";

const HighHeelIcon = ({ width = 150, color = "#e3b416" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const svgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true); // Csak akkor vált, ha láthatóvá válik
          console.log("Látom a cipőt!", entry.isIntersecting)
        }
      },
      { threshold: 0.5 }, // Akkor indul, ha a cipő fele már látszik
    );

    if (svgRef.current) {
      observer.observe(svgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="150 130 250 250"
      width={width}
      height={width}
      fill="none"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animated-shoe"
    >
      <g className={isVisible ? "start-animation" : "hidden-lines"}>
        <path
          className="drawing-line"
          d="M 315.561 322.751 L 316.655 262.596 C 316.717 271.885 315.658 230.738 333.968 212.025 C 352.278 193.312 323.135 154.369 323.567 154.369"
        />
        <path
          className="drawing-line"
          d="M 323.087 154.309 C 313.06 140.898 306.597 142.89 286.463 167.556"
        />
        <path
          className="drawing-line"
          d="M 287.388 166.477 C 239.915 223.763 272.977 270.316 195.819 308.34"
        />
        <path
          className="drawing-line"
          d="M 196.975 307.729 C 186.558 312.787 155.418 333.158 166.738 337.132"
        />
        <path
          className="drawing-line"
          d="M 166.831 337.241 C 356.685 378.954 237.765 283 327.603 220.184"
        />
        <path
          className="drawing-line"
          d="M 275.596 268.444 C 267.377 326.763 199.586 313.148 217.633 294.309"
        />
        <path
          className="drawing-line"
          d="M 275.481 268.869 C 279.021 236.949 292.273 195.106 311.81 163.574"
        />
        <path
          className="drawing-line"
          d="M 311.07 164.134 C 311.25 165.563 319.521 150.675 316.048 147.355"
        />
        <path
          className="drawing-line"
          d="M 301.297 246.906 C 308.747 250.085 308.458 325.693 308.12 323.616"
        />
        <path
          className="drawing-line"
          d="M 308.673 323.432 C 308.311 325.24 314.704 325.735 315.312 322.694"
        />
        <path
          className="drawing-line"
          d="M 311.255 248.198 L 311.439 316.977"
        />
        <path
          className="drawing-line"
          d="M 294.106 198.434 C 262.235 218.425 245.733 303.722 231.78 310.363"
        />
      </g>
    </svg>
  );
};

export default HighHeelIcon;
