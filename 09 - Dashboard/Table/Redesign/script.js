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

  const icons = {
    "uv-index": `<svg width="1em" height="1em" aria-focusable="false" aria-hidden="true" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="m34.65 10.01a3 3 0 0 0-0.8848 0.1406 3 3 0 0 0-0.2812 0.1055 3 3 0 0 0-0.7598 0.4746 3 3 0 0 0-0.4141 0.4316 3 3 0 0 0-0.3203 0.5078 3 3 0 0 0-0.1211 0.2734 3 3 0 0 0-0.1543 0.5801 3 3 0 0 0-0.03516 0.2969 3 3 0 0 0 0.02344 0.5996 3 3 0 0 0 0.05469 0.293 3 3 0 0 0 0.08594 0.2891 3 3 0 0 0 0.07617 0.1953c2.734 6.6 3.418 13.53 2.354 20.08-6.555 1.064-13.48 0.3804-20.08-2.354a3 3 0 0 0-2.297 5.543c6.6 2.734 11.98 7.148 15.87 12.54-3.883 5.388-9.265 9.801-15.87 12.54a3 3 0 0 0 2.297 5.543c6.6-2.734 13.53-3.418 20.08-2.354 1.064 6.555 0.3804 13.48-2.354 20.08a3 3 0 0 0 5.543 2.297c2.734-6.6 7.148-11.98 12.54-15.87 5.388 3.883 9.801 9.265 12.54 15.87a3 3 0 0 0 5.543-2.297c-2.734-6.6-3.418-13.53-2.354-20.08 6.555-1.064 13.48-0.3804 20.08 2.354a3 3 0 0 0 2.297-5.543c-6.6-2.734-11.98-7.148-15.87-12.54 3.883-5.388 9.265-9.801 15.87-12.54a3 3 0 0 0-2.297-5.543c-6.6 2.734-13.53 3.418-20.08 2.354-1.064-6.555-0.3804-13.48 2.354-20.08a3 3 0 0 0 0.2285-0.8672 3 3 0 0 0 0.003906-0.5996 3 3 0 0 0-0.2148-0.8711 3 3 0 0 0-0.2852-0.5273 3 3 0 0 0-0.1797-0.2402 3 3 0 0 0-0.2031-0.2207 3 3 0 0 0-0.2227-0.1992 3 3 0 0 0-1.352-0.6152 3 3 0 0 0-0.5977-0.04688 3 3 0 0 0-0.2988 0.02148 3 3 0 0 0-0.2949 0.05273 3 3 0 0 0-0.2891 0.08008 3 3 0 0 0-0.2793 0.1094 3 3 0 0 0-0.5195 0.2988 3 3 0 0 0-1.039 1.328c-2.734 6.6-7.148 11.98-12.54 15.87-5.388-3.883-9.801-9.265-12.54-15.87a3 3 0 0 0-0.873-1.201 3 3 0 0 0-0.7676-0.4629 3 3 0 0 0-0.2832-0.09961 3 3 0 0 0-0.291-0.07226 3 3 0 0 0-0.5977-0.05469z"/>
   </svg>
   `,
    snow: `<svg width="1em" height="1em" aria-focusable="false" aria-hidden="true" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="m49.96 7.465a2.5 2.5 0 0 0-2.463 2.535v13.96l-7.732-7.732a2.5 2.5 0 0 0-3.535 3.535l11.27 11.27v14.63l-12.67-7.318-4.125-15.39a2.5 2.5 0 0 0-4.828 1.293l2.83 10.56-12.09-6.982a2.5 2.5 0 0 0-3.465 0.9297 2.5 2.5 0 0 0 0.9648 3.402l12.09 6.982-10.56 2.83a2.5 2.5 0 0 0 1.293 4.828l15.39-4.123 12.67 7.316-12.67 7.316-15.39-4.123a2.5 2.5 0 0 0-1.293 4.828l10.56 2.83-12.09 6.982a2.5 2.5 0 0 0-0.9277 3.465 2.5 2.5 0 0 0 3.428 0.8672l12.09-6.982-2.83 10.56a2.5 2.5 0 0 0 4.828 1.293l4.125-15.39 12.67-7.316v14.63l-11.27 11.27a2.5 2.5 0 0 0 3.535 3.535l7.732-7.732v13.96a2.5 2.5 0 0 0 2.537 2.535 2.5 2.5 0 0 0 2.463-2.535v-13.96l7.732 7.732a2.5 2.5 0 0 0 3.535-3.535l-11.27-11.27v-14.63l12.67 7.316 4.125 15.39a2.5 2.5 0 0 0 4.828-1.293l-2.83-10.56 12.09 6.982a2.5 2.5 0 0 0 3.465-0.9297 2.5 2.5 0 0 0-0.9648-3.402l-12.09-6.982 10.56-2.83a2.5 2.5 0 0 0-1.293-4.828l-15.39 4.123-12.67-7.316 12.67-7.316 15.39 4.123a2.5 2.5 0 0 0 1.293-4.828l-10.56-2.83 12.09-6.982a2.5 2.5 0 0 0 0.9277-3.465 2.5 2.5 0 0 0-3.428-0.8672l-12.09 6.982 2.83-10.56a2.5 2.5 0 0 0-4.828-1.293l-4.125 15.39-12.67 7.318v-14.63l11.27-11.27a2.5 2.5 0 0 0-3.535-3.535l-7.732 7.732v-13.96a2.5 2.5 0 0 0-2.537-2.535z"/>
   </svg>
   `,
    plus: `<svg width="1em" height="1em" aria-focusable="false" aria-hidden="true" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path fill="currentColor" d="m49.92 19.93a5 5 0 0 0-4.924 5.07v20h-20a5 5 0 1 0 0 10h20v20a5 5 0 1 0 10 0v-20h20a5 5 0 1 0 0-10h-20v-20a5 5 0 0 0-5.076-5.07z" />
 </svg>
 `,
  };

  const timeParseSeconds = timeParse("%s");
  const timeParseDate = timeParse("%Y-%m-%d");

  const timeFormatDate = timeFormat("%-m/%d");
  const timeFormatHour = timeFormat("%-H");
  const timeFormatHourTwelveHours = timeFormat("%-I %p");

  const formatTemperatureMax = format(".1f");
  const formatWindSpeed = format(".2f");

  const strokeWidth = 1;
  const positionScale = scaleLinear()
    .domain([0, 23])
    .range([strokeWidth / 2, 100 - strokeWidth / 2]);

  const colorTemperatureMaxScale = scaleLinear()
    .domain(extent(dataset, (d) => d.temperatureMax))
    .range(["hsl(199, 100%, 85%)", "hsl(0, 100%, 81%)"]);

  const colorWindSpeedScale = scaleLinear()
    .domain(extent(dataset, (d) => d.windSpeed))
    .range(["hsl(0, 0%, 100%)", "hsl(209, 19%, 72%)"]);

  const temperatureMaxClass = "temperatureMax";
  const windSpeedClass = "windSpeed";

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
      class: temperatureMaxClass,
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
        )}"><svg width="100" height="10" viewBox="0 0 100 10" style="width: 100%; height: auto;"><g transform="translate(${positionScale(
          parseInt(timeFormatHour(timeParseSeconds(d)))
        )} 0)"><path fill="none" stroke="currentColor" stroke-width="${strokeWidth}" d="M 0 0 v 10" /></g></svg></span>`,
    },
    {
      key: "windSpeed",
      label: "Wind Speed",
      align: "right",
      class: windSpeedClass,
      render: (d) => formatWindSpeed(d),
    },
    {
      key: "precipType",
      label: "Did Snow",
      align: "center",
      render: (d) =>
        d === "snow" ? `<span aria-label="Snow">${icons.snow}</span>` : "",
    },
    {
      key: "uvIndex",
      label: "UV Index",
      align: "left",
      render: (d) =>
        `<span aria-label="${d}">${Array(min([d, uvIndexThreshold]))
          .fill()
          .map(() => icons["uv-index"])
          .join("")}${d > uvIndexThreshold ? icons.plus : ""}</span>`,
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
        class: metric.class,
        value: d[metric.key],
        align: metric.align,
        render: metric.render,
      }))
    )
    .enter()
    .append("td")
    .attr("class", (d) => (d.class ? d.class : ""))
    .style("text-align", (d) => d.align)
    .html((d) => d.render(d.value));

  selectAll("td.windSpeed").style("background", (d) =>
    colorWindSpeedScale(d.value)
  );

  selectAll(`td.${temperatureMaxClass}`).style("background", (d) =>
    colorTemperatureMaxScale(d.value)
  );
}

drawDashboard();
