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
      { threshold: 0.5 }
    );

    if (svgRef.current) {
      observer.observe(svgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 500 500"
      width={width}
      height={width}
      fill="none"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animated-panda"
    >
      <g className={isVisible ? "start-animation" : "hidden-lines"}>
        {/* Panda alapelemek */}
        <path d="M 180.967 410.793 L 181.718 412.295 L 180.216 412.295 L 180.967 410.793 Z" style={{ fill: "rgb(216, 216, 216)", stroke: "rgb(0, 0, 0)" }} />
        <path style={{ stroke: "rgb(0, 0, 0)", fill: "rgb(122, 42, 171)" }} d="M 102.522 223.167 C 103.735 273.316 183.353 604.925 178.613 408.99" />
        <path style={{ fill: "rgb(122, 42, 171)", stroke: "rgb(122, 42, 171)" }} d="M 103.323 225.87 C 107.825 234.874 180.238 434.918 181.817 406.886 C 187.676 302.859 289.156 312.128 298.757 408.49 C 300.264 423.62 365.23 234.686 376.45 223.467 C 337.625 276.411 191.43 313.728 103.323 225.87 Z" />

        {/* Új útvonalak */}
        <path style={{ fill: "rgb(122, 42, 171)", stroke: "rgb(122, 42, 171)", paintOrder: "stroke" }} d="M 314.777 79.445 C 339.697 28.881 405.695 73.36 359.832 123.298" />
        <path style={{ fill: "rgb(122, 42, 171)", stroke: "rgb(122, 42, 171)" }} d="M 183.22 192.38 C 106.868 201.213 177.394 62.736 209.051 153.934" />
        <path style={{ fill: "rgb(115, 63, 222)", stroke: "rgb(122, 42, 171)" }} d="M 183.22 191.779 C 184.933 179.791 209.938 155.533 209.651 153.935" />
        <path style={{ fill: "rgb(122, 42, 171)", stroke: "rgb(122, 42, 171)" }} d="M 271.526 156.337 C 287.421 67.489 377.19 182.512 297.357 195.985" />
        <path style={{ fill: "none", stroke: "rgb(122, 42, 171)" }} d="M 272.727 155.136 C 269.863 157.96 290.122 167.333 297.357 195.985" />
        <path style={{ fill: "rgb(122, 42, 171)", stroke: "rgb(122, 42, 171)" }} d="M 218.662 191.179 C 219.843 160.374 269.313 172.512 260.112 192.38" />
        <path style={{ fill: "rgb(122, 42, 171)", stroke: "rgb(122, 42, 171)" }} d="M 217.942 190.099 C 233.68 204.126 261.315 192.176 260.232 192.02" />
        <path style={{ fill: "rgb(122, 42, 171)", stroke: "rgb(122, 42, 171)" }} d="M 235.482 195.775 C 232.332 246.685 246.306 240.006 242.69 196.256" />
        <path style={{ fill: "rgb(122, 42, 171)", stroke: "rgb(122, 42, 171)" }} d="M 102.55 222.866 C 52.71 296.041 -4.708 486.811 173.328 486.222" />
        <path style={{ fill: "rgb(122, 42, 171)", stroke: "rgb(122, 42, 171)" }} d="M 167.24 486.523 C 230.384 483.776 243.432 415.9 179.736 410.592" />
        <path style={{ fill: "rgb(122, 42, 171)", fillRule: "evenodd", stroke: "rgb(122, 42, 171)" }} d="M 375.81 223.167 C 443.658 328.53 446.239 477.225 332.559 486.643 C 287.674 499.942 206.028 434.384 296.195 407.668" />
      </g>

      {/* Külső, mindig látható elemek */}
      <path style={{ fill: "none", stroke: "rgb(122, 42, 171)", paintOrder: "stroke" }} d="M 102.363 221.515 C 98.68 -27.432 410.216 34.459 376.172 223.797" />
      <path style={{ fill: "rgb(122, 42, 171)", stroke: "rgb(122, 42, 171)" }} d="M 123.148 123.298 C 69.921 90.031 127.056 24.069 163.997 77.042" />
    </svg>
  );
};

export default PandaIcon;
