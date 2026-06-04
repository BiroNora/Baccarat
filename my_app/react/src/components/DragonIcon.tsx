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

  return (
    <svg
      ref={svgRef}
      viewBox="-50 0 500 500"
      width={width}
      height={width}
      className="animated-dragon"
    >
      {/* Animált csoport: a sárkány teste és lába/farka */}
      <g className={isVisible ? "start-animation" : "hidden-lines"}>
        <path
          fill="#995210"
          stroke="#995210"
          strokeWidth="3"
          d="M -33.342 17.519 C 243.789 61.141 -59.155 103.889 -28.536 259.409 C -22.582 268.339 12.92 260.319 10.711 257.006 C 9.638 362.056 192.812 453.174 131.656 479.673 L 214.155 507.707 L 352.721 506.105 C 368.229 506.105 342.28 413.194 288.644 384.359 C 262.565 388.923 111.122 247.253 181.316 219.361 C 251.51 191.469 279.108 266.971 315.076 249.797 C 351.044 232.623 311.092 281.183 272.625 289.845 C 598.466 312.783 436.435 26.304 -33.342 17.519 Z"
        />
        <path
          fill="#995210"
          stroke="#995210"
          strokeWidth="3"
          d="M 131.757 479.275 C 142.178 498.38 -10.773 442.909 -37.247 394.373 C -37.247 394.373 -18.688 507.94 23.627 495.293 C 65.942 482.646 210.251 508.108 210.251 508.108"
        />
      </g>

      {/* Részletvonal (csoporton kívül) */}
      <path
        fill="rgb(0, 0, 0)"
        stroke="rgb(0, 0, 0)"
        strokeWidth="3"
        d="M 190.927 90.106 C 220.343 72.456 310.636 133.619 299.057 140.566 C 273.32 180.716 223.353 142.043 190.927 93.309"
      />
    </svg>
  );
};

export default DragonIcon;
