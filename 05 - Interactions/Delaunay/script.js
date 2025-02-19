const {
  json,
  scaleLinear,
  extent,
  select,
  timeParse,
  timeFormat,
  format,
  axisBottom,
  axisLeft,
  Delaunay,
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

  bounds
    .append("g")
    .selectAll("circle")
    .data(dataset)
    .enter()
    .append("circle")
    .attr("r", 5)
    .attr("cx", (d) => xScale(xAccessor(d)))
    .attr("cy", (d) => yScale(yAccessor(d)))
    .attr("fill", (d) => colorScale(colorAccessor(d)));

  /* INTERACTION */
  const tooltip = select("#wrapper").append("div").attr("id", "tooltip");
  tooltip.append("h2");
  tooltip.append("p");
  tooltip.append("p");

  function onMouseEnter(event, d) {
    const parseDate = timeParse("%Y-%m-%d");
    const formatDate = timeFormat("%B %A %-d, %Y");
    const formatMetric = format(".2f");

    const x = xScale(xAccessor(d));
    const y = yScale(yAccessor(d));

    tooltip
      .style(
        "transform",
        `translate(calc(-50% + ${x + dimensions.margin.left}px), calc(-100% + ${
          y + dimensions.margin.top - 5
        }px - 0.5rem))`
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

    bounds
      .append("circle")
      .style("pointer-events", "none")
      .attr("id", "tooltipCircle")
      .attr("fill", "maroon")
      .attr("r", 6)
      .attr("cx", x)
      .attr("cy", y);
  }

  function onMouseLeave() {
    tooltip.style("opacity", 0).style("visibility", "hidden");

    bounds.select("#tooltipCircle").remove();
  }

  const delaunay = Delaunay.from(
    dataset,
    (d) => xScale(xAccessor(d)),
    (d) => yScale(yAccessor(d))
  );
  const voronoi = delaunay.voronoi();
  voronoi.xmax = dimensions.boundedWidth;
  voronoi.ymax = dimensions.boundedHeight;

  bounds
    .append("g")
    .selectAll("path")
    .data(dataset)
    .enter()
    .append("path")
    .attr("d", (d, i) => voronoi.renderCell(i))
    .attr("fill", "transparent")
    // .attr('stroke', 'currentColor')
    // .attr('stroke-width', 0.5)
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
