const {
  select,
  transition,
  scaleLinear,
  extent,
  bin,
  max,
  mean,
  axisBottom,
  json,
} = d3;

function drawBarChart() {
  const dimensions = {
    width: 500,
    height: 350,
    margin: {
      top: 30,
      right: 15,
      bottom: 50,
      left: 15,
    },
  };

  const barPadding = 2;

  dimensions.boundedWidth =
    dimensions.width - (dimensions.margin.left + dimensions.margin.right);
  dimensions.boundedHeight =
    dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

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

  const defs = bounds.append("defs");

  const gradientId = "overlay-gradient";
  const maskId = "overlay-mask";

  defs
    .append("linearGradient")
    .attr("id", gradientId)
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", 0)
    .attr("y2", 1)
    .selectAll("stop")
    .data(["hsl(0, 0%, 100%)", "hsl(0, 0%, 0%)"])
    .enter()
    .append("stop")
    .attr("stop-color", (d) => d)
    .attr("offset", (d, i, { length }) => `${(i * 100) / (length - 1)}%`);

  defs
    .append("mask")
    .attr("id", maskId)
    .append("rect")
    .attr("width", dimensions.boundedWidth)
    .attr("height", dimensions.boundedHeight)
    .attr("fill", `url(#${gradientId})`);

  const binsGroup = bounds.append("g");
  const meanGroup = bounds.append("g");
  const axisGroup = bounds.append("g");
  const overlayGroup = bounds.append("g");

  const thresholds = 10;
  const defaultBins = Array(thresholds + 1)
    .fill("")
    .map((d, i, { length }) => {
      const bandWidth = dimensions.boundedWidth / length;
      const padding = barPadding;
      const width = bandWidth - padding * 2;
      const height = Math.floor(
        Math.random() * (dimensions.boundedHeight / 2) +
          dimensions.boundedHeight / 2
      );

      const x = i * bandWidth + padding;
      const y = dimensions.boundedHeight - height;
      return {
        x,
        y,
        width,
        height,
      };
    });

  const binGroups = binsGroup
    .selectAll("g")
    .data(defaultBins)
    .enter()
    .append("g");

  binGroups
    .append("rect")
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y)
    .attr("width", (d) => d.width)
    .attr("height", (d) => d.height)
    .attr("fill", "hsl(0, 0%, 85%)");

  meanGroup.style("opacity", 0);

  meanGroup
    .append("line")
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", 0)
    .attr("y2", dimensions.boundedHeight)
    .attr("stroke-width", 1)
    .attr("stroke", "currentColor")
    .attr("stroke-dasharray", "2 6");

  meanGroup
    .append("text")
    .text("Mean")
    .attr("font-size", 14)
    .attr("text-anchor", "middle")
    .attr("y", -5);

  const xAxisGroup = axisGroup
    .append("g")
    .attr("transform", `translate(0 ${dimensions.boundedHeight})`);

  xAxisGroup
    .append("path")
    .attr("d", `M 0.5 0.5 h ${dimensions.boundedWidth}`)
    .attr("stroke", "currentColor")
    .attr("stroke-width", 1)
    .attr("fill", "none");

  xAxisGroup
    .append("text")
    .attr("class", "color-main")
    .attr("font-size", 16)
    .attr("font-weight", 400)
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", dimensions.margin.bottom - 10);

  const overlayBinGroups = overlayGroup
    .append("g")
    .attr("class", "color-background")
    .selectAll("g")
    .data(defaultBins)
    .enter()
    .append("g");

  overlayBinGroups
    .append("rect")
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y)
    .attr("width", (d) => d.width)
    .attr("height", (d) => d.height)
    .attr("stroke", "currentColor")
    .attr("fill", "currentColor")
    .attr("mask", `url(#${maskId})`);

  const overlayMessageGroup = overlayGroup
    .append("g")
    .attr("fill", "currentColor")
    .attr("text-anchor", "middle")
    .attr(
      "transform",
      `translate(${dimensions.boundedWidth / 2} ${
        dimensions.boundedHeight / 2
      })`
    );

  overlayMessageGroup
    .append("use")
    .attr("x", -20)
    .attr("y", -80)
    .attr("width", 40)
    .attr("height", 40)
    .attr("class", "color-sub")
    .attr("fill", "currentColor");

  overlayMessageGroup
    .append("text")
    .attr("class", "color-main")
    .attr("font-size", 36)
    .attr("font-weight", 900)
    .text("Loading");

  overlayMessageGroup
    .append("text")
    .attr("class", "color-sub")
    .attr("font-size", 16)
    .text("Please wait as we fetch the data")
    .attr("y", 42);

  function handleErrorState(error) {
    overlayMessageGroup.select("use").attr("href", "#icon-error");

    overlayMessageGroup
      .select("text:nth-of-type(1)")
      .text("Something went wrong");

    overlayMessageGroup
      .select("text:nth-of-type(2)")
      .text("Review the documentation to learn more about the issue");
  }

  function handleEmptyState() {
    const overlayTransition = transition().delay(250).duration(1000);

    binGroups
      .selectAll("rect")
      .transition(overlayTransition)
      .attr("y", dimensions.boundedHeight)
      .attr("height", 0)
      .remove();

    overlayBinGroups
      .selectAll("rect")
      .transition(overlayTransition)
      .attr("y", dimensions.boundedHeight)
      .attr("height", 0)
      .remove();

    overlayMessageGroup.select("use").attr("href", "#icon-empty");

    overlayMessageGroup.select("text:nth-of-type(1)").text("No data yet");

    overlayMessageGroup
      .select("text:nth-of-type(2)")
      .text("Please try again with a different filter");
  }

  function handleLoadedState(dataset) {
    const metric = "windSpeed";
    const metricAccessor = (d) => d[metric];

    const xScale = scaleLinear()
      .domain(extent(dataset, metricAccessor))
      .range([0, dimensions.boundedWidth])
      .nice();

    const binGenerator = bin()
      .domain(xScale.domain())
      .value(metricAccessor)
      .thresholds(thresholds);

    const bins = binGenerator(dataset);

    const yAccessor = (d) => d.length;
    const yScale = scaleLinear()
      .domain([0, max(bins, yAccessor)])
      .range([dimensions.boundedHeight, 0])
      .nice();

    const overlayTransition = transition().duration(750);

    overlayGroup.transition(overlayTransition).style("opacity", 0).remove();

    const update = binsGroup.selectAll("g").data(bins);
    const enter = update.enter().append("g");
    const exit = update.exit();

    const exitTransition = transition(overlayTransition).duration(750);
    const updateTransition = transition(
      exit.empty() ? overlayTransition : exitTransition
    )
      .transition()
      .duration(1000);
    const enterTransition = transition(updateTransition)
      .transition()
      .duration(1000);

    exit
      .select("rect")
      .transition(exitTransition)
      .attr("y", dimensions.boundedHeight)
      .attr("height", 0);

    exit.transition(exitTransition).remove();

    enter
      .append("rect")
      .attr("fill", "cornflowerblue")
      .attr("x", (d) => xScale(d.x0) + barPadding)
      .attr("width", (d) =>
        max([0, xScale(d.x1) - xScale(d.x0) - barPadding * 2])
      )
      .attr("y", dimensions.boundedHeight)
      .attr("height", 0)
      .transition(enterTransition)
      .attr("y", (d) => yScale(yAccessor(d)))
      .attr("height", (d) => dimensions.boundedHeight - yScale(yAccessor(d)));

    update
      .select("rect")
      .transition(updateTransition)
      .attr("x", (d) => xScale(d.x0) + barPadding)
      .attr("width", (d) =>
        max([0, xScale(d.x1) - xScale(d.x0) - barPadding * 2])
      )
      .attr("y", (d) => yScale(yAccessor(d)))
      .attr("height", (d) => dimensions.boundedHeight - yScale(yAccessor(d)))
      .attr("fill", "cornflowerblue");

    enter
      .merge(update)
      .append("text")
      .attr("class", "color-main")
      .attr("x", (d) => xScale(d.x0) + (xScale(d.x1) - xScale(d.x0)) / 2)
      .attr("y", (d) => yScale(yAccessor(d)) - 5)
      .text((d) => yAccessor(d))
      .attr("font-size", 13)
      .attr("text-anchor", "middle")
      .style("opacity", 0)
      .transition(enterTransition)
      .delay((d, i) => i * 50)
      .style("opacity", 1);

    const meanValue = mean(dataset, metricAccessor);

    meanGroup
      .transition(enterTransition)
      .transition()
      .style("opacity", 1)
      .style("transform", `translate(${xScale(meanValue)}px, 0px)`);

    const xAxis = axisBottom(xScale).ticks(5).tickSize(0).tickPadding(5);

    xAxisGroup
      .select("text")
      .text(metric)
      .style("opacity", 0)
      .transition(updateTransition)
      .style("opacity", 1);

    xAxisGroup.transition(updateTransition).call(xAxis);

    xAxisGroup
      .selectAll("g.tick text")
      .attr("class", "color-sub")
      .attr("font-size", 12);
  }

  setTimeout(() => {
    json("../../../nyc_weather_data.json")
      .then((dataset) => {
        if (dataset.length === 0) {
          handleEmptyState();
        } else {
          handleLoadedState(dataset);
        }
      })
      .catch((error) => {
        console.error(error);
        handleErrorState(error);
      });
  }, 2500);
}

drawBarChart();
