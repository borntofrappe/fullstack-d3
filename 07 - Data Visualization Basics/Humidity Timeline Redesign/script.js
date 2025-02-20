const {
  json,
  timeParse,
  timeFormat,
  timeWeeks,
  timeWeek,
  mean,
  timeMonth,
  extent,
} = d3;

async function drawLineChart() {
  /* ACCESS DATA */
  const data = await json("../../nyc_weather_data.json");

  const dateParser = timeParse("%Y-%m-%d");
  const dateFormatter = timeFormat("%Y-%m-%d");

  const xAccessor = (d) => dateParser(d.date);
  const yAccessor = (d) => d.humidity;

  // sort by date and in ascending order
  const dataset = data.sort((a, b) => xAccessor(a) - xAccessor(b));

  // downsample the data to consider one value per week (the average of the days in the week)
  const weeks = timeWeeks(
    timeWeek.offset(xAccessor(dataset[0]), -1),
    xAccessor(dataset[dataset.length - 1])
  );

  const downsampleData = weeks.map((week, index) => {
    const weekStart = week;
    const weekEnd = weeks[index + 1] || new Date();
    const days = dataset.filter(
      (d) => xAccessor(d) > weekStart && xAccessor(d) <= weekEnd
    );
    return {
      humidity: mean(days, yAccessor),
      date: dateFormatter(week),
    };
  });

  // for the seasons consider one year before the first one
  const startDate = xAccessor(dataset[0]);
  const endDate = xAccessor(dataset[dataset.length - 1]);
  // 1 year more than the dataset, so to consider winter of the previous cycle
  const years = d3
    .timeYears(timeMonth.offset(startDate, -13), endDate)
    .map((yearDate) => parseInt(timeFormat("%Y")(yearDate)));

  const seasons = [
    {
      name: "Spring",
      date: "3-20",
      color: "hsl(0 0% 100%)",
    },
    {
      name: "Summer",
      date: "6-21",
      color: "hsl(165 83% 37%)",
    },
    {
      name: "Fall",
      date: "9-21",
      color: "hsl(0 0% 100%)",
    },
    {
      name: "Winter",
      date: "12-21",
      color: "hsl(210 73% 53%)",
    },
  ];

  const seasonData = [];
  years.forEach((year) => {
    seasons.forEach(({ name, date, color }, index) => {
      const seasonStart = dateParser(`${year}-${date}`);
      const seasonEnd = dateParser(
        seasons[index + 1]
          ? `${year}-${seasons[index + 1].date}`
          : `${year + 1}-${seasons[0].date}`
      );

      const days = dataset.filter(
        (d) => xAccessor(d) > seasonStart && xAccessor(d) <= seasonEnd
      );

      if (days.length > 0) {
        seasonData.push({
          name,
          color,
          start: seasonStart,
          end: seasonEnd,
          mean: mean(days, yAccessor),
        });
      }
    });
  });

  /* CHART DIMENSIONS */
  const dimensions = {
    width: 900,
    height: 300,
    margin: {
      top: 10,
      right: 10,
      bottom: 30,
      left: 80,
    },
  };

  dimensions.boundedWidth =
    dimensions.width - (dimensions.margin.left + dimensions.margin.right);
  dimensions.boundedHeight =
    dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

  /* SCALES */
  const xScale = d3
    .scaleTime()
    .domain(extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth]);

  const yScale = d3
    .scaleLinear()
    .domain(extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0])
    .nice();

  /* DRAW DATA */
  const wrapper = d3
    .select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height)
    .style("color", "hsl(0 0% 20%)");

  const bounds = wrapper
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
    );

  const defsGroup = bounds.append("g");
  const seasonsGroup = bounds.append("g");
  const pointsGroup = bounds.append("g");
  const lineGroup = bounds.append("g");
  const axisGroup = bounds.append("g");

  // 10 to avoid an overlap with the label for the y axis
  const clipPathSeasonsId = "clip-path-seasons";
  defsGroup
    .append("clipPath")
    .attr("id", clipPathSeasonsId)
    .append("rect")
    .attr("y", 10)
    .attr("width", dimensions.boundedWidth)
    .attr("height", dimensions.boundedHeight - 10);

  seasonsGroup.attr("clip-path", `url(#${clipPathSeasonsId})`);

  const seasonsGroups = seasonsGroup
    .append("g")
    .selectAll("g")
    .data(seasonData)
    .enter()
    .append("g");

  seasonsGroups
    .append("rect")
    .attr("x", ({ start }) => xScale(start))
    .attr("width", ({ start, end }) => xScale(end) - xScale(start))
    .attr("height", dimensions.boundedHeight)
    .attr("fill", ({ color }) => color)
    .attr("opacity", 0.1);

  seasonsGroups
    .append("path")
    .attr(
      "d",
      ({ start, end, mean }) =>
        `M ${xScale(start)} ${yScale(mean)} H ${xScale(end)}`
    )
    .attr("fill", "none")
    .attr("stroke", "currentColor")
    .attr("stroke-width", 1);

  pointsGroup
    .selectAll("circle")
    .data(dataset)
    .enter()
    .append("circle")
    .attr("cx", (d) => xScale(xAccessor(d)))
    .attr("cy", (d) => yScale(yAccessor(d)))
    .attr("r", 2)
    .attr("fill", "hsl(210 17% 58%)");

  const lineGenerator = d3
    .line()
    .x((d) => xScale(xAccessor(d)))
    .y((d) => yScale(yAccessor(d)))
    .curve(d3.curveBasis);

  lineGroup
    .append("path")
    .attr("d", lineGenerator(downsampleData))
    .attr("fill", "none")
    .attr("stroke", "currentColor")
    .attr("stroke-width", 2);

  /* PERIPHERALS */
  const xAxisGroup = axisGroup
    .append("g")
    .attr("transform", `translate(0 ${dimensions.boundedHeight})`);

  xAxisGroup
    .selectAll("text")
    .data(seasonData)
    .enter()
    .append("text")
    .text((d) => d.name)
    .attr(
      "x",
      ({ start, end }) => xScale(start) + (xScale(end) - xScale(start)) / 2
    )
    .attr("y", dimensions.margin.bottom - 8)
    .attr("fill", "currentColor")
    .attr("text-anchor", "middle")
    .attr("font-size", 15);

  const yAxisGenerator = d3
    .axisLeft()
    .scale(yScale)
    .ticks(3)
    .tickSize(0)
    .tickPadding(5);

  const yAxisGroup = axisGroup.append("g").call(yAxisGenerator);

  yAxisGroup
    .append("text")
    .text("Relative humidity")
    .attr("y", 5)
    .attr("text-anchor", "start")
    .attr("fill", "currentColor");

  yAxisGroup.selectAll("text").attr("font-size", 13);

  yAxisGroup
    .append("text")
    .text("Season mean")
    .attr("x", -10)
    .attr("y", yScale(seasonData[0].mean))
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "middle")
    .attr("fill", "currentColor")
    .attr("font-size", 12)
    .attr("opacity", 0.7);

  yAxisGroup.select("path").remove();
}

drawLineChart();
