const { json, select } = d3;

async function drawDashboard() {
  const dataset = await json("../../../nyc_weather_data.json");
  const metrics = [
    {
      key: "date",
      label: "Day",
    },
    {
      key: "summary",
      label: "Summary",
    },
    {
      key: "temperatureMax",
      label: "Max Temp",
    },
    {
      key: "temperatureMaxTime",
      label: "Max Temp Time",
    },
    {
      key: "windSpeed",
      label: "Wind Speed",
    },
    {
      key: "precipType",
      label: "Precipitation",
    },
    {
      key: "uvIndex",
      label: "UV Index",
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
    .text((d) => d.label);

  const tableRows = table
    .append("tbody")
    .selectAll("tr")
    .data(dataset)
    .enter()
    .append("tr");

  tableRows
    .selectAll("td")
    .data((d) => metrics.map((metric) => d[metric.key]))
    .enter()
    .append("td")
    .text((d) => d);
}

drawDashboard();
