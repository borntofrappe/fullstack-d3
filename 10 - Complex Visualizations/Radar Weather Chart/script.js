const {
  json,
  timeParse,
  timeFormat,
  format,
  scaleTime,
  extent,
  select,
  interpolateYlOrRd,
  timeMonths,
  scaleLinear,
  areaRadial,
  scaleSqrt,
  scaleOrdinal,
  arc,
  scaleSequential,
  pointer,
  range,
} = d3;

async function drawRadarWeatherChart() {
  /* ACCESS DATA */
  const dataset = await json("../../nyc_weather_data.json");

  const dateParser = timeParse("%Y-%m-%d");
  const dateAccessor = (d) => dateParser(d.date);

  const temperatureMinAccessor = (d) => d.temperatureMin;
  const temperatureMaxAccessor = (d) => d.temperatureMax;
  const uvIndexAccessor = (d) => d.uvIndex;
  const precipProbabilityAccessor = (d) => d.precipProbability;
  const precipTypeAccessor = (d) => d.precipType;
  const cloudCoverAccessor = (d) => d.cloudCover;

  const formatDate = (d) => timeFormat("%b")(d);
  const formatTemperature = (d) => `${format(".0f")(d)}°F`;

  const formatDateTooltip = (d) => timeFormat("%B %-d")(d);
  const formatTemperatureTooltip = (d) => `${format(".1f")(d)}°F`;
  const formatCloudCoverTooltip = (d) => format(".2f")(d);
  const formatPrecipProbabilityTooltip = (d) => format(".0%")(d);

  /* CHART DIMENSIONS */
  const dimensions = {
    size: 600,
    margin: 160,
  };

  dimensions.boundedSize = dimensions.size - dimensions.margin * 2;
  dimensions.boundedRadius = dimensions.boundedSize / 2;

  /* SCALES */
  const angleScale = scaleTime()
    .domain(extent(dataset, dateAccessor))
    .range([0, Math.PI * 2]);

  const radiusScale = scaleLinear()
    .domain(
      extent([
        ...dataset.map(temperatureMaxAccessor),
        ...dataset.map(temperatureMinAccessor),
      ])
    )
    .range([0, dimensions.boundedRadius])
    .nice();

  /* DRAW DATA */
  const root = select("#root");

  const header = root.append("header");

  header.append("h1").text("New York City Weather in 2018");

  const wrapper = root.append("main").attr("id", "wrapper");

  const tooltip = wrapper.append("div").attr("id", "tooltip");
  tooltip.append("h2");
  tooltip.append("p");
  tooltip.append("dl");

  const svg = wrapper
    .append("svg")
    .attr("width", dimensions.size)
    .attr("height", dimensions.size);

  const defs = svg.append("defs");
  const gradientId = "tempereature-gradient";
  const gradientColorScale = interpolateYlOrRd;

  const stops = 10;
  const stopData = range(stops).map((i) => ({
    color: gradientColorScale(i / (stops - 1)),
    offset: `${(i * 100) / (stops - 1)}%`,
  }));

  defs
    .append("radialGradient")
    .attr("id", gradientId)
    .selectAll("stop")
    .data(stopData)
    .enter()
    .append("stop")
    .attr("stop-color", (d) => d.color)
    .attr("offset", (d) => d.offset);

  const bounds = svg
    .append("g")
    .attr(
      "transform",
      `translate(${dimensions.size / 2} ${dimensions.size / 2})`
    );

  const peripheralsGroup = bounds.append("g");
  const axisGroup = peripheralsGroup.append("g");
  const gridLinesGroup = peripheralsGroup.append("g");

  const temperatureGroup = bounds.append("g");
  const uvIndexGroup = bounds.append("g");
  const cloudCoverGroup = bounds.append("g");
  const precipGroup = bounds.append("g");

  const annotationsGroup = bounds.append("g");

  /* PERIPHERALS / 1 */
  const months = timeMonths(...angleScale.domain());
  const temperatureTicks = radiusScale.ticks(4);
  const monthGroups = axisGroup
    .append("g")
    .selectAll("g")
    .data(months)
    .enter()
    .append("g");

  monthGroups
    .append("path")
    .attr("transform", (d) => `rotate(${(angleScale(d) * 180) / Math.PI})`)
    .attr("d", `M 0 0 v -${dimensions.boundedRadius}`)
    .attr("fill", "none")
    .attr("stroke", "#cecece")
    .attr("stroke-width", 1);

  monthGroups
    .append("text")
    .attr("class", "color-sub")
    .attr("transform", (d) => {
      const angle = angleScale(d) - Math.PI / 2;
      const x =
        Math.cos(angle) * (dimensions.boundedRadius + dimensions.margin * 0.6);
      const y =
        Math.sin(angle) * (dimensions.boundedRadius + dimensions.margin * 0.6);

      return `translate(${x} ${y})`;
    })
    .text((d) => formatDate(d))
    .attr("fill", "currentColor")
    .attr("font-size", 12)
    .attr("text-anchor", (d) => {
      const angle = angleScale(d) - Math.PI / 2;
      const x =
        Math.cos(angle) * (dimensions.boundedRadius + dimensions.margin / 2);

      return Math.abs(x) < 5 ? "middle" : x > 0 ? "start" : "end";
    })
    .attr("dominant-baseline", "middle");

  const gridLinesGroups = gridLinesGroup
    .append("g")
    .selectAll("g")
    .data(temperatureTicks)
    .enter()
    .append("g");

  gridLinesGroups
    .append("circle")
    .attr("r", (d) => radiusScale(d))
    .attr("fill", "none")
    .attr("stroke", "#cecece")
    .attr("stroke-width", 1);

  gridLinesGroups
    .filter((d) => d)
    .append("rect")
    .attr("fill", "#e7ecee")
    .attr("width", 39.5)
    .attr("x", 0.5)
    .attr("y", (d) => radiusScale(d) * -1 - 7)
    .attr("height", 16);

  gridLinesGroups
    .filter((d) => d)
    .append("text")
    .text((d) => formatTemperature(d))
    .attr("fill", "#8395a7")
    .attr("x", 4)
    .attr("y", (d) => radiusScale(d) * -1 + 2)
    .attr("font-size", 12)
    .attr("dominant-baseline", "middle")
    .attr("opacity", 0.75);

  /* DATA */
  const freezingTemperature = 32;
  if (freezingTemperature > radiusScale.domain()[0]) {
    temperatureGroup
      .append("circle")
      .attr("r", radiusScale(freezingTemperature))
      .attr("fill", "#00d2d3")
      .attr("opacity", 0.15);
  }

  const temperatureAreaGenerator = areaRadial()
    .angle((d) => angleScale(dateAccessor(d)))
    .innerRadius((d) => radiusScale(temperatureMinAccessor(d)))
    .outerRadius((d) => radiusScale(temperatureMaxAccessor(d)));

  temperatureGroup
    .append("path")
    .attr("d", temperatureAreaGenerator(dataset))
    .attr("fill", `url(#${gradientId})`);

  const uvIndexThreshold = 8;
  const uvIndexData = dataset.filter(
    (d) => uvIndexAccessor(d) >= uvIndexThreshold
  );
  const uvIndexStrokeLength =
    (radiusScale(temperatureTicks[1]) - radiusScale(temperatureTicks[0])) / 2;
  const uvIndexY =
    radiusScale(temperatureTicks[temperatureTicks.length - 1]) -
    uvIndexStrokeLength / 2;

  uvIndexGroup
    .selectAll("path")
    .data(uvIndexData)
    .enter()
    .append("path")
    .attr("d", `M 0 -${uvIndexY} v -${uvIndexStrokeLength}`)
    .attr(
      "transform",
      (d) => `rotate(${(angleScale(dateAccessor(d)) * 180) / Math.PI})`
    )
    .attr("fill", "none")
    .attr("stroke", "#feca57")
    .attr("stroke-width", 3);

  const cloudCoverRadiusScale = scaleSqrt()
    .domain(extent(dataset, cloudCoverAccessor))
    .range([1, 10]);

  cloudCoverGroup
    .selectAll("circle")
    .data(dataset)
    .enter()
    .append("circle")
    .attr("transform", (d) => {
      const angle = angleScale(dateAccessor(d)) - Math.PI / 2;
      const x =
        Math.cos(angle) * (dimensions.boundedRadius + dimensions.margin * 0.5);
      const y =
        Math.sin(angle) * (dimensions.boundedRadius + dimensions.margin * 0.5);

      return `translate(${x} ${y})`;
    })
    .attr("fill", "#c8d6e5")
    .attr("r", (d) => cloudCoverRadiusScale(cloudCoverAccessor(d)))
    .attr("opacity", 0.5);

  const precipProbabilityRadiusScale = scaleSqrt()
    .domain(extent(dataset, precipProbabilityAccessor))
    .range([1, 8]);

  const precipTypes = ["rain", "sleet", "snow"];

  const precipTypeColorScale = scaleOrdinal()
    .domain(precipTypes)
    .range(["#54a0ff", "#636e72", "#b2bec3"]);

  precipGroup
    .selectAll("circle")
    .data(dataset.filter(precipTypeAccessor))
    .enter()
    .append("circle")
    .attr("transform", (d) => {
      const angle = angleScale(dateAccessor(d)) - Math.PI / 2;
      const x =
        Math.cos(angle) * (dimensions.boundedRadius + dimensions.margin * 0.3);
      const y =
        Math.sin(angle) * (dimensions.boundedRadius + dimensions.margin * 0.3);

      return `translate(${x} ${y})`;
    })
    .attr("fill", (d) => precipTypeColorScale(precipTypeAccessor(d)))
    .attr("r", (d) =>
      precipProbabilityRadiusScale(precipProbabilityAccessor(d))
    )
    .attr("opacity", 0.5);

  /* PERIPHERALS / 2 */
  function drawAnnotation(text, angle, offset) {
    const theta = angle - Math.PI / 2;
    const x1 = Math.cos(theta) * offset;
    const y1 = Math.sin(theta) * offset;

    const x2 =
      Math.cos(theta) * (dimensions.boundedRadius + dimensions.margin * 0.8);
    const y2 =
      Math.sin(theta) * (dimensions.boundedRadius + dimensions.margin * 0.8);

    const annotationGroup = annotationsGroup.append("g");

    annotationGroup
      .append("path")
      .attr("d", `M ${x1} ${y1} L ${x2} ${y2}`)
      .attr("fill", "none")
      .attr("stroke", "currentColor")
      .attr("stroke-width", 0.5);

    annotationGroup
      .append("text")
      .text(text)
      .attr("transform", `translate(${x2 + 4} ${y2 + 2})`)
      .attr("fill", "currentColor")
      .attr("dominant-baseline", "middle")
      .attr("font-size", 13);

    if (text.toLowerCase() === "precipitation") {
      const annotationDetailsGroup = annotationsGroup
        .append("g")
        .attr("transform", `translate(${x2 + 20} ${y2 + 20})`);

      const annotationDetailsGroups = annotationDetailsGroup
        .selectAll("g")
        .data(precipTypes)
        .enter()
        .append("g")
        .attr("transform", (d, i) => `translate(0 ${18 * i})`);

      annotationDetailsGroups
        .append("circle")
        .attr("r", 4)
        .attr("fill", (d) => precipTypeColorScale(d));

      annotationDetailsGroups
        .append("text")
        .text((d) => d)
        .attr("x", 8)
        .attr("dominant-baseline", "middle")
        .attr("font-size", 12);
    }
  }

  drawAnnotation(
    "Cloud Cover",
    angleScale(dateAccessor(dataset[22])),
    dimensions.boundedRadius + dimensions.margin * 0.5
  );
  drawAnnotation(
    "Precipitation",
    angleScale(dateAccessor(dataset[40])),
    dimensions.boundedRadius + dimensions.margin * 0.3
  );
  drawAnnotation(
    "Temperature",
    angleScale(dateAccessor(dataset[134])),
    radiusScale(temperatureMaxAccessor(dataset[134]))
  );
  drawAnnotation(
    `UV Index over ${uvIndexThreshold}`,
    angleScale(dateAccessor(uvIndexData[4])),
    uvIndexY + uvIndexStrokeLength / 2
  );
  if (radiusScale.domain()[0] <= freezingTemperature) {
    drawAnnotation(
      `Freezing temperature`,
      (Math.PI * 9) / 10,
      radiusScale(freezingTemperature)
    );
  }

  /* INTERACTIONS */
  const highlightPath = bounds
    .append("g")
    .style("pointer-events", "none")
    .append("path")
    .attr("fill", "#8395a7")
    .attr("fill-opacity", 0.4)
    .style("mix-blend-mode", "multiply");

  const tooltipDistance = dimensions.boundedRadius + dimensions.margin;
  const arcGenerator = arc().innerRadius(0).outerRadius(tooltipDistance);

  const temperatureColorScale = scaleSequential()
    .domain(
      extent([
        ...dataset.map(temperatureMinAccessor),
        ...dataset.map(temperatureMaxAccessor),
      ])
    )
    .interpolator(gradientColorScale);

  function onMouseMove(event) {
    const [x, y] = pointer(event);
    const theta = Math.atan2(y, x);
    let angle = theta + Math.PI / 2;
    if (angle < 0) {
      angle += Math.PI * 2;
    }

    const date = angleScale.invert(angle);
    const d = dataset.find(
      (datum) => timeFormat("%Y-%m-%d")(date) === datum.date
    );

    if (d) {
      arcGenerator.startAngle(angle - 0.05).endAngle(angle + 0.05);

      highlightPath.style("opacity", 1).attr("d", arcGenerator);

      const tooltipX = Math.cos(theta) * tooltipDistance;
      const tooltipY = Math.sin(theta) * tooltipDistance;

      const translateX = `calc(${
        dimensions.boundedRadius + dimensions.margin + tooltipX
      }px - 50%)`;

      const translateY = `calc(${
        dimensions.boundedRadius + dimensions.margin + tooltipY
      }px - 50%)`;

      tooltip
        .style("opacity", 1)
        .style("transform", `translate(${translateX}, ${translateY})`);

      tooltip.select("h2").text(formatDateTooltip(date));

      const temperatureMin = temperatureMinAccessor(d);
      const temperatureMax = temperatureMaxAccessor(d);
      tooltip
        .select("p")
        .html(
          `<span style="border-bottom: 0.25rem solid ${temperatureColorScale(
            temperatureMin
          )};">${formatTemperatureTooltip(
            temperatureMin
          )}</span> - <span style="border-bottom: 0.25rem solid ${temperatureColorScale(
            temperatureMax
          )};">${formatTemperatureTooltip(temperatureMax)}</span>`
        );

      const values = [
        {
          title: "UV Index",
          description: uvIndexAccessor(d),
          color: "#feca57",
        },
        {
          title: "Cloud Cover",
          description: formatCloudCoverTooltip(cloudCoverAccessor(d)),
          color: "#c8d6e5",
        },
        {
          title: "Precipitation Probability",
          description: formatPrecipProbabilityTooltip(
            precipProbabilityAccessor(d)
          ),
          color: "currentColor",
        },
        {
          title: "Precipitation Type",
          description: precipTypeAccessor(d) || "",
          color: precipTypeAccessor(d)
            ? precipTypeColorScale(precipTypeAccessor(d))
            : "#bccad2",
        },
      ];

      tooltip
        .select("dl")
        .html(
          values
            .map(
              ({ title, description, color }) =>
                `<dt style="border-left: 0.25rem solid ${color};">${title}</dt><dd>${description}</dd>`
            )
            .join("")
        );
    }
  }

  function onMouseLeave() {
    highlightPath.style("opacity", 0);

    tooltip.style("opacity", 0);
  }

  bounds
    .append("circle")
    .attr("r", dimensions.boundedRadius + dimensions.margin)
    .attr("fill", "transparent")
    .on("mousemove", onMouseMove)
    .on("mouseleave", onMouseLeave);
}

drawRadarWeatherChart();
