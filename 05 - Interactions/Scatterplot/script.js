const {
  json,
  scaleLinear,
  extent,
  select,
  timeParse,
  timeFormat,
  format,
  axisLeft,
  axisBottom,
} = d3;

async function drawScatterplot() {
  /* ACCESS DATA */
  const dataset = await json("../../nyc_weather_data.json");

  const xAccessor = (d) => d.dewPoint;
  const yAccessor = (d) => d.humidity;
  const colorAccessor = (d) => d.cloudCover;

  /* CHART DIMENSIONS */
  const dimensions = {
    width: 600,
    height: 600,
    margin: {
      top: 10,
      right: 10,
      bottom: 50,
      left: 60,
    },
  };

  dimensions.boundedWidth =
    dimensions.width - (dimensions.margin.left + dimensions.margin.right);
  dimensions.boundedHeight =
    dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

  /* SCALES */
  const xScale = scaleLinear()
    .domain(extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth])
    .nice();

  const yScale = scaleLinear()
    .domain(extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0]);

  const colorScale = scaleLinear()
    .domain(extent(dataset, colorAccessor))
    .range(["skyblue", "darkslategrey"]);

  /* DRAW DATA */
  const wrapper = select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  const bounds = wrapper
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
    );

  /* INTERACTION */
  const tooltip = select("#wrapper #tooltip");

  function onMouseEnter(event, d) {
    const parseDate = timeParse("%Y-%m-%d");
    const formatDate = timeFormat("%B %A %-d, %Y");
    const formatMetric = format(".2f");

    const x = xScale(xAccessor(d)) + dimensions.margin.left;
    const y = yScale(yAccessor(d)) + dimensions.margin.top - 5;

    tooltip
      .style(
        "transform",
        `translate(calc(-50% + ${x}px), calc(-100% + ${y}px - 0.5rem))`
      )
      .style("opacity", 1)
      .style("visibility", "visible");

    tooltip.select("h2").text(formatDate(parseDate(d.date)));
    tooltip
      .select("p:nth-of-type(1)")
      .text(`Humidity: ${formatMetric(yAccessor(d))}`);
    tooltip
      .select("p:nth-of-type(2)")
      .text(`Dew point: ${formatMetric(xAccessor(d))}`);
  }

  function onMouseLeave() {
    tooltip.style("opacity", 0).style("visibility", "hidden");
  }

  bounds
    .append("g")
    .selectAll("circle")
    .data(dataset)
    .enter()
    .append("circle")
    .attr("r", 5)
    .attr("cx", (d) => xScale(xAccessor(d)))
    .attr("cy", (d) => yScale(yAccessor(d)))
    .attr("fill", (d) => colorScale(colorAccessor(d)))
    .on("mouseenter", onMouseEnter)
    .on("mouseleave", onMouseLeave);

  /* PERIPHERALS */
  const xAxisGenerator = axisBottom().scale(xScale);
  const xAxis = bounds
    .append("g")
    .style("transform", `translate(0px, ${dimensions.boundedHeight}px)`)
    .call(xAxisGenerator);

  xAxis
    .append("text")
    .text("Dew point (°F)")
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", dimensions.margin.bottom - 10)
    .attr("font-size", 15)
    .attr("fill", "currentColor");

  const yAxisGenerator = axisLeft().scale(yScale);
  const yAxis = bounds.append("g").call(yAxisGenerator);

  yAxis
    .append("text")
    .text("Relative humidity")
    .attr("font-size", 15)
    .attr("fill", "currentColor")
    .style("text-anchor", "middle")
    .style(
      "transform",
      `translate(${-dimensions.margin.left + 15}px, ${
        dimensions.boundedHeight / 2
      }px) rotate(-90deg)`
    );
}

drawScatterplot();
