export default function AxisBottom({
  scale,
  width,
  height,
  formatTick = (d) => d,
  styleTicks,
  styleLine,
  label,
  styleLabel,
}) {
  const ticks = scale.ticks(Math.floor(width / 20));

  return (
    <g transform={`translate(0 ${height})`}>
      <g
        fill="currentColor"
        fontSize="0.8em"
        textAnchor="middle"
        style={styleTicks}
      >
        {ticks.map((d, index) => (
          <text key={index} x={scale(d)} y="1.3em">
            {formatTick(d)}
          </text>
        ))}
      </g>

      <line x2={width} stroke="currentColor" style={styleLine} />

      {label && (
        <text
          x={width / 2}
          y="2.5em"
          fill="currentColor"
          fontSize="1em"
          textAnchor="middle"
          style={styleLabel}
        >
          {label}
        </text>
      )}
    </g>
  );
}

// #9da09c
// #9da09c
