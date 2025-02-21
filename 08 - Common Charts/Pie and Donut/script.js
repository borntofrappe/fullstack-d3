const { json, schemePastel1, pie, arc, select } = d3;

async function drawDonutChart() {
  /* ACCESS DATA */
  const dataset = await json("../../nyc_weather_data.json");
  const iconAccessor = (d) => d.icon;

  const keys = [
    "clear-day",
    "partly-cloudy-day",
    "partly-cloudy-night",
    "rain",
    "other",
  ];

  const iconData = dataset
    .map((d) => iconAccessor(d))
    .reduce((acc, curr) => {
      const key = keys.includes(curr) ? curr : "other";
      acc[key] = acc[key] + 1 || 1;
      return acc;
    }, {});

  /* CHART DIMENSIONS */
  const dimensions = {
    width: 400,
    height: 400,
    margin: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    },
  };

  dimensions.boundedWidth =
    dimensions.width - (dimensions.margin.left + dimensions.margin.right);
  dimensions.boundedHeight =
    dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

  /* SCALES */
  const radius = dimensions.boundedWidth / 2;
  const colors = schemePastel1;

  const valueAccessor = (d) => d.value;

  const pieGenerator = pie()
    .padAngle(0.01)
    .value((d) => valueAccessor(d));

  const arcGenerator = arc()
    .innerRadius(radius * 0.75)
    .outerRadius(radius);

  const iconPieData = pieGenerator(
    Object.entries(iconData).map(([key, value]) => ({
      key,
      value,
    }))
  );

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

  const centerGroup = bounds
    .append("g")
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.boundedWidth / 2}px, ${
        dimensions.boundedHeight / 2
      }px)`
    );

  centerGroup
    .append("text")
    .text("2018 Weather")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("y", -12)
    .attr("font-size", 28)
    .attr("font-weight", "bold");

  centerGroup
    .append("text")
    .text("New York City, NY")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("y", 22)
    .attr("font-size", 16);

  const sliceGroups = centerGroup
    .selectAll("g")
    .data(iconPieData)
    .enter()
    .append("g");

  sliceGroups
    .append("path")
    .attr("fill", (d, i) => colors[i % colors.length])
    .attr("d", (d) => arcGenerator(d));

  const centroidGroups = sliceGroups
    .append("g")
    .attr("transform", (d) => `translate(${arcGenerator.centroid(d)})`);

  centroidGroups
    .append("use")
    .attr("href", (d) => `#icon-${d.data.key}`)
    .attr("x", -10)
    .attr("y", -10)
    .attr("width", 20)
    .attr("height", 20)
    .attr("transform", "translate(0 -8)");

  centroidGroups
    .append("text")
    .attr("fill", "currentColor")
    .text((d) => valueAccessor(d.data))
    .attr("text-anchor", "middle")
    .attr("y", 16)
    .attr("font-size", 13);
}

drawDonutChart();
