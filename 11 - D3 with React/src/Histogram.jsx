import { bin, extent, max, scaleLinear } from "d3";

export default function Histogram({ data, accessor, label }) {
  const numberThresholds = 8;
  const width = 250;
  const height = 100;
  const margin = {
    top: 10,
    right: 10,
    bottom: 25,
    left: 28,
  };
  const barPadding = 1;
  const strokeWidthAxis = 0.6;
  const fontSize = 7;

  const xScale = scaleLinear()
    .domain(extent(data, accessor))
    .range([0, width])
    .nice();

  const binGenerator = bin()
    .domain(xScale.domain())
    .value(accessor)
    .thresholds(numberThresholds);

  const bins = binGenerator(data);

  const yAccessor = (d) => d.length;
  const yScale = scaleLinear()
    .domain([0, max(bins, yAccessor)])
    .range([height, 0])
    .nice();

  const xTicks = xScale.ticks(Math.floor(width / 50));
  const yTicks = yScale.ticks(Math.floor(height / 25));

  
  const id = `histogram-gradient-${Math.random().toString().slice(-5)}`;

  const viewBox =
    "0 0 " +
    (width + margin.left + margin.right) +
    " " +
    (height + margin.top + margin.bottom);

  return (
    <svg viewBox={viewBox}>
      <defs>
        <linearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={0}
          x2="0"
          y2={height}
        >
          <stop stopColor="#9c85f7" offset="0" />
          <stop stopColor="#d0c7f4" offset="1" />
        </linearGradient>
      </defs>
      <g transform={`translate(${margin.left} ${margin.top})`}>
        <g>
          {bins.map((d, index) => (
            <rect
              key={index}
              fill={`url(#${id})`}
              x={xScale(d.x0) + barPadding / 2}
              width={max([0, xScale(d.x1) - xScale(d.x0) - barPadding])}
              y={yScale(yAccessor(d))}
              height={height - yScale(yAccessor(d))}
            />
          ))}
        </g>

        <g transform={`translate(0 ${height})`}>
          <g
            fill="#9da09c"
            fontSize={fontSize}
            textAnchor="middle"
            transform={`translate(0 ${fontSize * 1.5})`}
          >
            {xTicks.map((d, index) => (
              <text key={index} x={xScale(d)}>
                {d}
              </text>
            ))}
          </g>
          <line x2={width} stroke="#bdc3c7" strokeWidth={strokeWidthAxis} />
          <text
            fill="#9da09c"
            fontSize={fontSize}
            textAnchor="middle"
            transform={`translate(${width / 2} ${margin.bottom - 3})`}
          >
            {label}
          </text>
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
          <line y2={height} stroke="#bdc3c7" strokeWidth={strokeWidthAxis} />
          <text
            fill="#9da09c"
            fontSize={fontSize}
            textAnchor="middle"
            transform={`translate(${-margin.left + fontSize + 2} ${
              height / 2
            }) rotate(-90)`}
          >
            Count
          </text>
        </g>
      </g>
    </svg>
  );
}
