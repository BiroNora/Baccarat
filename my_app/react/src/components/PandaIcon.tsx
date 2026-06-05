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
        {/* A megadott útvonalak a csoporton belül */}
        <path style={{ fill: 'rgb(122, 42, 171)', strokeWidth: 1 }} d="M 82.499 212.655 C -5.142 367.14 35.316 477.615 144.173 472.967 C 185.375 483.81 239.033 417.412 160.994 396.876 C 191.522 261.646 286.736 336.227 284.342 398.478 C 203.234 409.884 249.106 479.824 303.565 472.166 C 406.583 485.913 442.223 337.244 358.831 212.655 C 321.004 269.627 165.334 300.816 82.499 212.655 Z"/>
        <path style={{ fill: 'rgb(122, 42, 171)', stroke: 'rgb(122, 42, 171)', paintOrder: 'stroke', strokeWidth: 1 }} d="M 295.261 69.375 C 320.181 18.811 386.179 63.29 340.316 113.228"/>
        <path style={{ fill: 'rgb(122, 42, 171)', strokeWidth: 1 }} d="M 163.704 182.31 C 87.352 191.143 157.878 52.666 189.535 143.864"/>
        <path style={{ fill: 'rgb(115, 63, 222)', stroke: 'rgb(122, 42, 171)', strokeWidth: 1 }} d="M 163.704 181.709 C 165.417 169.721 190.422 145.463 190.135 143.865"/>
        <path style={{ fill: 'rgb(122, 42, 171)', strokeWidth: 1 }} d="M 252.01 146.267 C 267.905 57.419 357.674 172.442 277.841 185.915"/>
        <path style={{ fill: 'none', strokeWidth: 1 }} d="M 253.211 145.066 C 250.347 147.89 270.606 157.263 277.841 185.915"/>
        <path style={{ fill: 'rgb(122, 42, 171)', stroke: 'rgb(122, 42, 171)', strokeWidth: 1 }} d="M 199.146 181.109 C 200.327 150.304 249.797 162.442 240.596 182.31"/>
        <path style={{ fill: 'rgb(122, 42, 171)', stroke: 'rgb(122, 42, 171)', strokeWidth: 1 }} d="M 198.426 180.029 C 214.164 194.056 241.799 182.106 240.716 181.95"/>
        <path style={{ fill: 'rgb(122, 42, 171)', stroke: 'rgb(122, 42, 171)', strokeWidth: 1 }} d="M 215.966 185.705 C 212.816 236.615 226.79 229.936 223.174 186.186"/>
      </g>

      {/* Külső, mindig látható útvonalak */}
      <path style={{ fill: 'none', strokeWidth: 1, stroke: 'rgb(0, 0, 0)', paintOrder: 'fill' }} d="M 82.847 211.445 C 79.164 -37.502 393.103 24.389 359.059 213.727"/>
      <path style={{ fill: 'rgb(122, 42, 171)', stroke: 'rgb(122, 42, 171)', strokeWidth: 1 }} d="M 103.632 113.228 C 50.405 79.961 107.54 13.999 144.481 66.972"/>
    </svg>
  );
};

export default PandaIcon;
