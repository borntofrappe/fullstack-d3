import {
  area,
  curveCatmullRom,
  extent,
  line,
  scaleLinear,
  scaleTime,
  timeFormat,
} from "d3";

export default function Timeline({ data, xAccessor, yAccessor, label }) {
  const width = 500;
  const height = 100;
  const margin = {
    top: 10,
    right: 10,
    bottom: 15,
    left: 35,
  };
  const fontSize = 7;
  const strokeWidthAxis = 0.2;
  const strokeWidthLine = 1;

  const formatDate = timeFormat("%-b %-d");

  const xScale = scaleTime().domain(extent(data, xAccessor)).range([0, width]);

  const yScale = scaleLinear()
    .domain(extent(data, yAccessor))
    .range([height, 0])
    .nice();

  const xTicks = xScale.ticks(Math.floor(width / 70));
  const yTicks = yScale.ticks(Math.floor(height / 20));

  const lineGenerator = line()
    .x((d) => xScale(xAccessor(d)))
    .y((d) => yScale(yAccessor(d)))
    .curve(curveCatmullRom);

  const areaGenerator = area()
    .x((d) => xScale(xAccessor(d)))
    .y0((d) => yScale(yScale.domain()[0]))
    .y1((d) => yScale(yAccessor(d)))
    .curve(curveCatmullRom);

  const gradientId = `timeline-gradient-${Math.random().toString().slice(-5)}`;

  const viewBox =
    "0 0 " +
    (width + margin.left + margin.right) +
    " " +
    (height + margin.top + margin.bottom);

  return (
    <svg viewBox={viewBox}>
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={0}
          x2="0"
          y2={height}
        >
          <stop stopColor="#e2def3" offset="0" />
          <stop stopColor="#f8f9fa" offset="1" />
        </linearGradient>
      </defs>
      <g transform={`translate(${margin.left} ${margin.top})`}>
        <path
          d={areaGenerator(data)}
          fill={`url(#${gradientId})`}
          opacity={0.2}
        />

        <path
          d={lineGenerator(data)}
          fill="none"
          stroke="#9980fa"
          strokeWidth={strokeWidthLine}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <g transform={`translate(0 ${height})`}>
          <g
            fill="#9da09c"
            fontSize={fontSize}
            textAnchor="middle"
            transform={`translate(0 ${fontSize * 1.5})`}
          >
            {xTicks.map((d, index) => (
              <text key={index} x={xScale(d)}>
                {formatDate(d)}
              </text>
            ))}
          </g>

          <line x2={width} stroke="#9da09c" strokeWidth={strokeWidthAxis} />
        </g>
        <g>
          <g
            fill="#9da09c"
            fontSize={fontSize}
            textAnchor="end"
            transform={`translate(${-fontSize * 0.7} 0)`}
          >
            {yTicks.map((d, index) => (
              <text key={index} y={yScale(d)}>
                {d}
              </text>
            ))}
          </g>
          <line y2={height} stroke="#9da09c" strokeWidth={strokeWidthAxis} />
          <text
            fill="#9da09c"
            fontSize={fontSize}
            textAnchor="middle"
            transform={`translate(${-margin.left + fontSize + 2} ${
              height / 2
            }) rotate(-90)`}
          >
            {label}
          </text>
        </g>
      </g>
    </svg>
  );
}
