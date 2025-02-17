const {
  json,
  timeParse,
  select,
  extent,
  min,
  scaleTime,
  scaleLinear,
  line,
  transition,
  axisLeft,
  axisBottom,
} = d3;

async function drawLineChart() {
  /* ACCESS DATA */
  const dataset = await json("../../nyc_weather_data.json");
  const dateParser = timeParse("%Y-%m-%d");

  const xAccessor = (d) => dateParser(d.date);
  const yAccessor = (d) => d.temperatureMax;

  /* CHART DIMENSIONS */
  const dimensions = {
    width: 800,
    height: 400,
    margin: {
      top: 10,
      right: 10,
      bottom: 20,
      left: 20,
    },
  };

  dimensions.boundedWidth =
    dimensions.width - (dimensions.margin.left + dimensions.margin.right);
  dimensions.boundedHeight =
    dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

  /* SCALES (Y) */
  const yScale = scaleLinear()
    .domain(extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0]);

  /* DRAW DATA (STATIC) */
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

  bounds
    .append("defs")
    .append("clipPath")
    .attr("id", "bounds-clip-path")
    .append("rect")
    .attr("width", dimensions.boundedWidth)
    .attr("height", dimensions.boundedHeight);

  const rectangle = bounds
    .append("g")
    .append("rect")
    .attr("x", 0)
    .attr("y", dimensions.boundedHeight)
    .attr("width", dimensions.boundedWidth)
    .attr("height", 0)
    .attr("fill", "hsl(180, 44%, 92%)");

  const axisGroup = bounds.append("g");
  const xAxisGroup = axisGroup
    .append("g")
    .style("transform", `translate(0px, ${dimensions.boundedHeight}px)`);

  const yAxisGroup = axisGroup.append("g");

  const lineGroup = bounds
    .append("g")
    .attr("clip-path", "url(#bounds-clip-path)");

  const linePath = lineGroup
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "hsl(41, 35%, 52%)")
    .attr("stroke-width", 2);

  function drawDays(data) {
    /* SCALES (X) */
    const xScale = scaleTime()
      .domain(extent(data.slice(1), xAccessor))
      .range([0, dimensions.boundedWidth]);

    /* DRAW DATA (DYNAMIC) */
    const lineGenerator = line()
      .x((d) => xScale(xAccessor(d)))
      .y((d) => yScale(yAccessor(d)));

    const lineTransition = transition().duration(1000);

    const freezingTemperatureY = min([dimensions.boundedHeight, yScale(32)]);
    rectangle
      .transition(lineTransition)
      .attr("y", freezingTemperatureY)
      .attr("height", dimensions.boundedHeight - freezingTemperatureY);

    /* wiggle
    linePath.transition(lineTransition).attr("d", lineGenerator(data));
    /* */

    // /* no wiggle
    const lastTwoPoints = data.slice(-2);
    const pixelsBetweenLastPoints =
      xScale(xAccessor(lastTwoPoints[1])) - xScale(xAccessor(lastTwoPoints[0]));

    linePath
      .attr("d", lineGenerator(data))
      .style("transform", `translate(${pixelsBetweenLastPoints}px, 0px)`)
      .transition(lineTransition)
      .style("transform", "translate(0px, 0px)");
    /* */

    const yAxisGenerator = axisLeft().scale(yScale);
    yAxisGroup.transition(lineTransition).call(yAxisGenerator);

    const xAxisGenerator = axisBottom().scale(xScale);
    xAxisGroup.transition(lineTransition).call(xAxisGenerator);
  }

  let initialDay = 0;
  const days = 100;
  drawDays(dataset.slice(initialDay, initialDay + days));

  const interval = setInterval(() => {
    initialDay += 1;
    drawDays(dataset.slice(initialDay, initialDay + days));

    if (initialDay + days >= dataset.length) {
      clearInterval(interval);
    }
  }, 1500);
}

drawLineChart();
