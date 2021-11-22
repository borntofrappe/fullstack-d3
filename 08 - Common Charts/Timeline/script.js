const {
  json,
  timeParse,
  scaleTime,
  scaleLinear,
  extent,
  select,
  line,
  axisLeft,
  axisBottom,
  selectAll,
} = d3;

async function drawLineChart() {
  /* ACCESS DATA */
  const data = await json("../../nyc_weather_data.json");
  const days = 100;
  const dataset = data.slice(0, days);

  const dateParser = timeParse("%Y-%m-%d");

  const xAccessor = (d) => dateParser(d.date);
  const yAccessor = (d) => d.temperatureMax;

  /* CHART DIMENSIONS */
  const dimensions = {
    width: 800,
    height: 350,
    margin: {
      top: 10,
      right: 10,
      bottom: 30,
      left: 70,
    },
  };

  dimensions.boundedWidth =
    dimensions.width - (dimensions.margin.left + dimensions.margin.right);
  dimensions.boundedHeight =
    dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

  /* SCALES */
  const xScale = scaleTime()
    .domain(extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth]);

  const yScale = scaleLinear()
    .domain(extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0])
    .nice();

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

  const lineGenerator = line()
    .x((d) => xScale(xAccessor(d)))
    .y((d) => yScale(yAccessor(d)));

  bounds
    .append("path")
    .attr("d", lineGenerator(dataset))
    .attr("fill", "none")
    .attr("stroke", "currentColor")
    .attr("stroke-width", 2);

  const groupPoints = bounds.append("g").style("opacity", 0);

  groupPoints
    .selectAll("circle")
    .data(dataset)
    .enter()
    .append("circle")
    .attr("r", 3.5)
    .attr("cx", (d) => xScale(xAccessor(d)))
    .attr("cy", (d) => yScale(yAccessor(d)))
    .attr("fill", "currentColor");

  /* PERIPHERALS */
  const axisGroup = bounds.append("g");
  const yAxisGenerator = axisLeft().scale(yScale).ticks(4);
  const yAxisGroup = axisGroup.append("g").call(yAxisGenerator);

  yAxisGroup
    .append("text")
    .text("Maximum Temperature (°F)")
    .attr("text-anchor", "middle")
    .attr("fill", "currentColor")
    .attr("font-size", 15)
    .attr("font-weight", "bold")
    .style(
      "transform",
      `translate(${-dimensions.margin.left + 24}px, ${
        dimensions.boundedHeight / 2
      }px) rotate(-90deg)`
    );

  const xAxisGenerator = axisBottom().scale(xScale).ticks(8);

  axisGroup
    .append("g")
    .style("transform", `translate(0px, ${dimensions.boundedHeight}px)`)
    .call(xAxisGenerator);

  selectAll("g.tick text").attr("font-size", 11);

  /* INTERACTIONS */
  select("#wrapper")
    .append("label")
    .text("Toggle points")
    .append("input")
    .attr("type", "checkbox")
    .on("input", (event) =>
      groupPoints.style("opacity", event.target.checked ? 1 : 0)
    );

  const curves = [
    "curveLinear",
    "curveMonotoneX",
    "curveNatural",
    "curveStep",
    "curveBasis",
    "curveCardinal",
  ];

  const selection = select("#wrapper")
    .append("label")
    .text("Select interpolation curve")
    .append("select");

  selection
    .selectAll("option")
    .data(curves)
    .enter()
    .append("option")
    .attr("value", (d) => d)
    .text((d) => d);

  selection.on("input", (event) => {
    const { value } = event.target;
    lineGenerator.curve(d3[value]);
    bounds.select("path").attr("d", lineGenerator(dataset));
  });
}

drawLineChart();
