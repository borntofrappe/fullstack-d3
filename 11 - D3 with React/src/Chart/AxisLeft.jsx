export default function AxisLeft({
  scale,
  width,
  height,
  formatTick = (d) => d,
  styleTicks,
  styleLine,
  label,
  styleLabel,
}) {
  const ticks = scale.ticks(Math.floor(height / 25));

  return (
    <g>
      <g
        fill="currentColor"
        fontSize="0.8em"
        textAnchor="end"
        style={styleTicks}
      >
        {ticks.map((d, index) => (
          <text key={index} x="-1.5ch" y={scale(d)}>
            {formatTick(d)}
          </text>
        ))}
      </g>

      <line y2={height} stroke="currentColor" style={styleLine} />

      <g transform={`translate(0 ${height / 2}) rotate(-90)`}>
        {label && (
          <text
            y="-2.75em"
            fill="currentColor"
            fontSize="1em"
            textAnchor="middle"
            style={styleLabel}
          >
            {label}
          </text>
        )}
      </g>
    </g>
  );
}

// #9da09c
// #9da09c
