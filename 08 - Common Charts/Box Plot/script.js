const {
  json,
  timeParse,
  timeFormat,
  timeMonths,
  max,
  median,
  quantile,
  scaleBand,
  scaleLinear,
  select,
  axisLeft,
  axisTop,
} = d3;

async function drawBoxPlot() {
  /* ACCESS DATA */
  const data = await json("../../nyc_weather_data.json");

  const dateParser = timeParse("%Y-%m-%d");
  const dateAccessor = (d) => dateParser(d.date);
  const dateFormatter = timeFormat("%b");

  const xAccessor = (d) => d.month;
  const yAccessor = (d) => d.temperatureMax;

  const dataset = [...data].sort((a, b) => dateAccessor(a) - dateAccessor(b));
  const months = timeMonths(
    dateAccessor(dataset[0]),
    dateAccessor(dataset[dataset.length - 1])
  );

  const monthsData = months.map((month, index) => {
    const monthStart = month;
    const monthEnd = months[index + 1] || new Date();

    const days = dataset.filter(
      (d) => dateAccessor(d) > monthStart && dateAccessor(d) <= monthEnd
    );

    const medianValue = median(days, yAccessor);
    const q1 = quantile(days, 0.25, yAccessor);
    const q3 = quantile(days, 0.75, yAccessor);
    const iqr = q3 - q1;

    const outliers = days.filter(
      (d) => Math.abs(yAccessor(d) - medianValue) > 1.5 * iqr
    );

    return {
      month: dateFormatter(month),
      median: medianValue,
      q1,
      q3,
      iqr,
      outliers,
    };
  });

  /* CHART DIMENSIONS */
  const dimensions = {
    width: 600,
    height: 400,
    margin: {
      top: 40,
      right: 10,
      bottom: 10,
      left: 60,
    },
  };

  dimensions.boundedWidth =
    dimensions.width - (dimensions.margin.left + dimensions.margin.right);
  dimensions.boundedHeight =
    dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

  /* SCALES */
  const xScale = scaleBand()
    .domain(monthsData.map((d) => xAccessor(d)))
    .range([0, dimensions.boundedWidth])
    .padding(0.15);

  const yScale = scaleLinear()
    .domain([0, max(dataset, yAccessor)])
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

  const axisGroup = bounds.append("g");
  const boxGroup = bounds.append("g");

  const boxesGroup = boxGroup
    .selectAll("g")
    .data(monthsData)
    .enter()
    .append("g")
    .attr(
      "transform",
      (d) => `translate(${xScale(xAccessor(d)) + xScale.bandwidth() / 2} 0)`
    );

  boxesGroup
    .append("g")
    .selectAll("circle")
    .data((d) => d.outliers)
    .enter()
    .append("circle")
    .attr("fill", "currentColor")
    .attr("r", 2)
    .attr("opacity", 0.5)
    .attr("cy", (d) => yScale(yAccessor(d)));

  boxesGroup
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "currentColor")
    .attr("stroke-width", 1)
    .attr(
      "d",
      (d) =>
        `M ${-xScale.bandwidth() / 4} ${yScale(d.median + d.iqr)} h ${
          xScale.bandwidth() / 2
        } m ${-xScale.bandwidth() / 4} 0 V ${yScale(d.median - d.iqr)} m ${
          -xScale.bandwidth() / 4
        } 0 h ${xScale.bandwidth() / 2}`
    );

  boxesGroup
    .append("rect")
    .attr("fill", "cornflowerblue")
    .attr("x", -xScale.bandwidth() / 2)
    .attr("width", xScale.bandwidth())
    .attr("y", (d) => yScale(d.q3))
    .attr("height", (d) => yScale(d.q1) - yScale(d.q3));

  boxesGroup
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "currentColor")
    .attr("stroke-width", 2)
    .attr(
      "d",
      (d) =>
        `M ${-xScale.bandwidth() / 2} ${yScale(
          d.median
        )} h ${xScale.bandwidth()}`
    );

  /* PERIPHERALS */
  const yAxisGenerator = axisLeft().scale(yScale).ticks(6).tickPadding(5);

  const yAxisGroup = axisGroup.append("g").call(yAxisGenerator);

  const xAxisGenerator = axisTop()
    .scale(xScale)
    .ticks(5)
    .tickSize(0)
    .tickPadding(10);

  axisGroup.append("g").call(xAxisGenerator);

  yAxisGroup
    .append("text")
    .text("Maximum Temperature (°F)")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", "currentColor")
    .attr("font-size", 14)
    .attr("font-weight", "bold")
    .style(
      "transform",
      `translate(${-dimensions.margin.left + 8}px, ${
        dimensions.boundedHeight / 2
      }px) rotate(-90deg)`
    );

  axisGroup.selectAll("g.tick text").attr("font-size", 11);
  yAxisGroup
    .selectAll("g.tick")
    .append("line")
    .attr("x2", dimensions.boundedWidth)
    .attr("fill", "none")
    .attr("stroke", "currentColor")
    .attr("stroke-width", "0.2");

  axisGroup.selectAll("path").remove();
}

drawBoxPlot();
