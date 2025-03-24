const {
  json,
  csv,
  geoEqualEarth,
  geoPath,
  geoGraticule10,
  extent,
  max,
  scaleLinear,
  select,
  format,
  Delaunay,
} = d3;

async function drawMap() {
  /* DATA */
  const countryShapes = await json("./world-geojson.json");
  const dataset = await csv("./databank_data.csv");

  /* for the elected metric create an object where the country is the key and the metric its accompanying value
  {
    AFG: 2.54834664435549,
    ALB: -0.0919722937442495,
    // ..
  }
  */
  const metric = "Population growth (annual %)";

  const metricDataByCountry = dataset.reduce((acc, curr) => {
    if (curr["Series Name"] === metric) {
      acc[curr["Country Code"]] = parseFloat(curr["2023 [YR2023]"]) || 0;
    }

    return acc;
  }, {});

  // ACCESSOR FUNCTIONS
  const countryNameAccessor = (d) => d.properties["NAME"];
  const countryIdAccessor = (d) => d.properties["ADM0_A3_IS"];

  /* CHART DIMENSIONS / 1 */
  const dimensions = {
    width: window.innerWidth * 0.9,
    margin: {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10,
    },
  };

  dimensions.boundedWidth =
    dimensions.width - (dimensions.margin.left + dimensions.margin.right);

  // SPHERE, PROJECTION and GENERATOR FUNCTION
  const sphere = { type: "Sphere" };
  const projection = geoEqualEarth().fitWidth(dimensions.boundedWidth, sphere);

  const pathGenerator = geoPath(projection);

  /* CHART DIMENSIONS / 2 */
  const y1 = pathGenerator.bounds(sphere)[1][1];

  dimensions.boundedHeight = y1;
  dimensions.height =
    dimensions.boundedHeight +
    (dimensions.margin.top + dimensions.margin.bottom);

  /* SCALES */
  const metricValues = Object.values(metricDataByCountry);
  const [minValue, maxValue] = extent(metricValues);
  const maxChange = max([Math.abs(minValue), Math.abs(maxValue)]);
  const colorScale = scaleLinear()
    .domain([-maxChange, 0, maxChange])
    .range(["indigo", "white", "darkgreen"]);

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

  // earth
  bounds
    .append("path")
    .attr("d", pathGenerator(sphere))
    .attr("fill", "hsl(180, 35%, 92%)")
    .attr("stroke", "none");

  // graticulate
  const graticuleJson = geoGraticule10();
  bounds
    .append("path")
    .attr("d", pathGenerator(graticuleJson))
    .attr("fill", "none")
    .attr("stroke", "hsl(180, 22%, 83%)");

  // countries
  const countries = bounds
    .append("g")
    .selectAll("path")
    .data(countryShapes.features)
    .enter()
    .append("path")
    .attr("d", pathGenerator)
    .attr("fill", (d) =>
      metricDataByCountry[countryIdAccessor(d)]
        ? colorScale(metricDataByCountry[countryIdAccessor(d)])
        : "hsl(206, 14%, 90%)"
    );

  /* NAVIGATOR */
  navigator.geolocation.getCurrentPosition((position) => {
    const { longitude, latitude } = position.coords;
    const [x, y] = projection([longitude, latitude]);

    bounds
      .append("g")
      .append("circle")
      .style("pointer-events", "none")
      .attr("cx", x)
      .attr("cy", y)
      .attr("fill", "hsl(234, 51%, 71%)")
      .transition()
      .delay(200)
      .duration(500)
      .attr("r", 6);
  });

  /* PERIPHERALS */
  const legendGroup = bounds
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.boundedWidth / 8}px, ${
        dimensions.boundedHeight / 2 + 24
      }px)`
    );

  legendGroup
    .append("text")
    .text("Population Growth")
    .attr("text-anchor", "middle")
    .attr("y", -42)
    .style("font-size", 18)
    .style("font-weight", "bold");

  legendGroup
    .append("text")
    .text("Percentage change in 2023")
    .attr("text-anchor", "middle")
    .attr("y", -24)
    .style("font-size", 14);

  const legendWidth = 100;
  const legendHeight = 20;

  const formatLegend = format(".1f");

  const linearGradientId = "linear-gradient-id";

  const linearGradient = wrapper
    .append("defs")
    .append("linearGradient")
    .attr("id", linearGradientId);

  linearGradient
    .selectAll("stop")
    .data(colorScale.range())
    .enter()
    .append("stop")
    .attr("stop-color", (d) => d)
    .attr("offset", (d, i, { length }) => `${(i * 100) / (length - 1)}%`);

  legendGroup
    .append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .attr("x", -legendWidth / 2)
    .attr("y", -legendHeight / 2)
    .attr("fill", `url(#${linearGradientId})`);

  legendGroup
    .append("text")
    .text(`${formatLegend(maxChange * -1)}%`)
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "middle")
    .attr("x", -legendWidth / 2 - 5)
    .attr("font-size", 12);

  legendGroup
    .append("text")
    .text(`${formatLegend(maxChange)}%`)
    .attr("text-anchor", "start")
    .attr("dominant-baseline", "middle")
    .attr("x", legendWidth / 2 + 5)
    .attr("font-size", 12);

  /* INTERACTIONS */
  const tooltip = select("#wrapper").append("div").attr("id", "tooltip");
  tooltip.append("h2");
  tooltip.append("p");

  function onMouseEnter(event, d) {
    const [x, y] = pathGenerator.centroid(d);
    const formatMetric = format(".2f");
    const metricData = metricDataByCountry[countryIdAccessor(d)];

    tooltip
      .style(
        "transform",
        `translate(calc(-50% + ${x + dimensions.margin.left}px), calc(-100% + ${
          y + dimensions.margin.top - 5
        }px - 0.5rem))`
      )
      .style("opacity", 1);

    tooltip.select("h2").text(countryNameAccessor(d));
    tooltip
      .select("p")
      .text(
        metricData
          ? `${formatMetric(metricData)}% population change`
          : "Data not available"
      );

    bounds
      .append("path")
      .attr("id", "tooltipCountry")
      .attr("fill", "cornflowerblue")
      .attr("d", pathGenerator(d))
      .style("pointer-events", "none");

    bounds
      .append("circle")
      .attr("id", "tooltipCircle")
      .attr("fill", "currentColor")
      .attr("r", 5)
      .attr("cx", x)
      .attr("cy", y)
      .style("pointer-events", "none");
  }

  function onMouseLeave() {
    select("#tooltip").style("opacity", 0);
    select("#tooltipCountry").remove();
    select("#tooltipCircle").remove();
  }

  // countries
  //   .on('mouseenter', onMouseEnter)
  //   .on('mouseleave', onMouseLeave)

  const delaunay = Delaunay.from(
    countryShapes.features,
    (d) => pathGenerator.centroid(d)[0],
    (d) => pathGenerator.centroid(d)[1]
  );
  const voronoi = delaunay.voronoi();
  voronoi.xmax = dimensions.boundedWidth;
  voronoi.ymax = dimensions.boundedHeight;

  bounds
    .append("g")
    .selectAll("path")
    .data(countryShapes.features)
    .enter()
    .append("path")
    .attr("d", (d, i) => voronoi.renderCell(i))
    .attr("fill", "transparent")
    // .attr('stroke', 'currentColor')
    // .attr('stroke-width', 0.5)
    .on("mouseenter", onMouseEnter)
    .on("mouseleave", onMouseLeave);
}

drawMap();
