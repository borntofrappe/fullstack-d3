const {
  json,
  timeParse,
  timeFormat,
  format,
  scaleLinear,
  extent,
  min,
  select,
  selectAll,
} = d3;

async function drawDashboard() {
  const dataset = await json("../../../nyc_weather_data.json");

  const timeParseSeconds = timeParse("%s");
  const timeParseDate = timeParse("%Y-%m-%d");

  const timeFormatDate = timeFormat("%-m/%d");
  const timeFormatHour = timeFormat("%-H");
  const timeFormatHourTwelveHours = timeFormat("%-I %p");

  const formatTemperatureMax = format(".1f");
  const formatWindSpeed = format(".2f");

  const strokeWidth = 1;
  const dimensions = {
    width: 100,
    height: 10,
  };
  const positionScale = scaleLinear()
    .domain([0, 23]) // hours of the day
    .range([strokeWidth / 2, dimensions.width - strokeWidth / 2]);

  const colorMaxTemperatureScale = scaleLinear()
    .domain(extent(dataset, (d) => d.temperatureMax))
    .range(["hsl(199, 100%, 85%)", "hsl(0, 100%, 81%)"]);

  const colorWindSpeedScale = scaleLinear()
    .domain(extent(dataset, (d) => d.windSpeed))
    .range(["hsl(0, 0%, 100%)", "hsl(209, 19%, 72%)"]);

  const classNames = {
    maxTemp: "temperatureMax",
    windSpeed: "windSpeed",
  };

  const uvIndexThreshold = 2;
  const metrics = [
    {
      key: "date",
      label: "Day",
      align: "left",
      render: (d) => timeFormatDate(timeParseDate(d)),
    },
    {
      key: "summary",
      label: "Summary",
      align: "left",
      render: (d) => d,
    },
    {
      key: "temperatureMax",
      label: "Max Temp",
      align: "right",
      className: classNames.maxTemp,
      render: (d) => formatTemperatureMax(d),
    },
    {
      key: "apparentTemperatureMaxTime",
      label: "Max Temp Time",
      align: "center",
      // render: d => timeFormatHourTwelveHours(timeParseSeconds(d)),
      render: (d) =>
        `<span aria-label="${timeFormatHourTwelveHours(
          timeParseSeconds(d)
        )}"><svg width="100" height="10" viewBox="0 0 ${dimensions.width} ${
          dimensions.height
        }" style="width: 100%; height: auto;">
          <path 
          d="
            M ${positionScale(parseInt(timeFormatHour(timeParseSeconds(d))))} 0 
            v ${dimensions.height} 
          fill="none" 
          stroke="currentColor" 
          stroke-width="${strokeWidth}"" />
        </svg></span>`,
    },
    {
      key: "windSpeed",
      label: "Wind Speed",
      align: "right",
      className: classNames.windSpeed,
      render: (d) => formatWindSpeed(d),
    },
    {
      key: "precipType",
      label: "Did Snow",
      align: "center",
      render: (d) =>
        d === "snow"
          ? '<span aria-label="Snow"><svg width="1em" height="1em"><use href="#icon-snow" /></svg></span>'
          : "",
    },
    {
      key: "uvIndex",
      label: "UV Index",
      align: "left",
      render: (d) =>
        `<span aria-label="${d}">${Array(min([d, uvIndexThreshold]))
          .fill()
          .map(
            () =>
              '<svg width="1em" height="1em"><use href="#icon-uv-index" /></svg>'
          )
          .join("")}${
          d > uvIndexThreshold
            ? '<svg width="1em" height="1em"><use href="#icon-plus-sign" /></svg>'
            : ""
        }</span>`,
    },
  ];

  const table = select("#wrapper").append("table");
  table
    .append("thead")
    .append("tr")
    .selectAll("th")
    .data(metrics)
    .enter()
    .append("th")
    .style("text-align", (d) => d.align)
    .text((d) => d.label);

  const tableRows = table
    .append("tbody")
    .selectAll("tr")
    .data(dataset)
    .enter()
    .append("tr");

  tableRows
    .selectAll("td")
    .data((d) =>
      metrics.map((metric) => ({
        key: metric.key,
        className: metric.className,
        value: d[metric.key],
        align: metric.align,
        render: metric.render,
      }))
    )
    .enter()
    .append("td")
    .attr("class", (d) => (d.className ? d.className : ""))
    .style("text-align", (d) => d.align)
    .html((d) => d.render(d.value));

  selectAll(`td.${classNames.windSpeed}`).style("background", (d) =>
    colorWindSpeedScale(d.value)
  );

  selectAll(`td.${classNames.maxTemp}`).style("background", (d) =>
    colorMaxTemperatureScale(d.value)
  );
}

drawDashboard();
