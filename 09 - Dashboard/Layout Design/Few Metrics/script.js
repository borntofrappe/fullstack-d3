const {
  json,
  timeParse,
  timeFormat,
  select,
  color,
  format,
  scaleQuantize,
  scaleLinear,
  extent,
} = d3;

async function drawDashboard() {
  const dataset = await json("../../../nyc_weather_data.json");
  const dateParser = timeParse("%Y-%m-%d");
  const dateFormatter = timeFormat("%B %-d, %Y");
  const dateAccessor = (d) => dateParser(d.date);

  const selectedDay = Math.floor(Math.random() * dataset.length);
  const metrics = [
    {
      key: "humidity",
      accessor: (d) => d.humidity,
      title: "Humidity",
      note: "relative, out of 100%",
      formatValue: (d) => `${format(".0f")(d * 100)}<span>%</span>`,
      colors: ["hsl(21, 95%, 84%)", "hsl(34, 100%, 50%)"],
      scales: {},
    },
    {
      key: "temperatureMin",
      accessor: (d) => d.temperatureMin,
      title: "Minimum Temperature",
      note: "degrees Fahrenheit",
      formatValue: (d) => `${format(".0f")(d)}`,
      colors: ["hsl(220, 100%, 87%)", "hsl(220, 80%, 41%)"],
      scales: {},
    },
    {
      key: "temperatureMax",
      accessor: (d) => d.temperatureMax,
      title: "Maximum Temperature",
      note: "degrees Fahrenheit",
      formatValue: (d) => `${format(".0f")(d)}`,
      colors: ["hsl(0, 100%, 85%)", "hsl(0, 92%, 43%)"],
      scales: {},
    },
  ];

  metrics.forEach((metric) => {
    const { accessor, colors } = metric;
    const domain = extent(dataset, accessor);

    metric.scales = {
      qualify: scaleQuantize()
        .domain(domain)
        .range(["very low", "low", "average", "high", "very high"]),
      rotate: scaleLinear().domain(domain).range([0, 180]),
      fill: scaleLinear().domain(domain).range(colors),
      strokeDashoffset: scaleLinear().domain(domain).range([1, 0]),
    };
  });

  const root = select("#root");
  const header = root.append("header");
  header.append("h1").text("Weather in New York City");
  header.append("h2").text(dateFormatter(dateAccessor(dataset[selectedDay])));
  const section = root.append("section");

  const dimensions = {
    width: 150,
    height: 140,
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

  const strokeWidthCircle = 1;
  const radiusCircle = dimensions.margin.left - strokeWidthCircle / 2;
  const paddingGauge = 2;
  const strokeWidthGauge = (radiusCircle - paddingGauge) * 2;

  const articles = section
    .selectAll("article")
    .data(metrics)
    .enter()
    .append("article");

  articles
    .append("h3")
    .text((d) => d.title)
    .append("span")
    .append("svg")
    .attr("viewBox", "0 0 1 1")
    .attr("width", "1em")
    .attr("height", "1em")
    .append("use")
    .attr("href", (d) => `#icon-${d.key}`);

  const svgs = articles
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height)
    .attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);

  svgs
    .append("defs")
    .append("linearGradient")
    .attr("id", (d) => `linear-gradient-${d.key}`)
    .selectAll("stop")
    .data((d) => d.colors)
    .enter()
    .append("stop")
    .attr("offset", (d, i, { length }) => `${(i * 100) / (length - 1)}%`)
    .attr("stop-color", (d) => d);

  const bounds = svgs
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
    );

  bounds
    .append("text")
    .attr("font-size", 20)
    .attr("fill", "currentColor")
    .text((d) => d.scales.qualify(d.accessor(dataset[selectedDay])))
    .attr("x", dimensions.boundedWidth / 2)
    .style("text-transform", "uppercase")
    .style("letter-spacing", "2px")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle");

  const groupsGauge = bounds
    .append("g")
    .attr(
      "transform",
      `translate(${dimensions.boundedWidth / 2} ${dimensions.boundedHeight})`
    );

  groupsGauge
    .append("path")
    .attr(
      "d",
      "M 0 -8 a 8 8 0 0 1 0 16 q -6 0 -16 -8 10 -8 16 -8 v 2 a 6 6 0 0 0 0 12 6 6 0 0 0 0 -12 v -2"
    )
    .attr("fill", "currentColor")
    .attr("stroke", "currentColor")
    .attr("stroke-width", 4)
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .attr(
      "transform",
      (d) => `rotate(${d.scales.rotate(d.accessor(dataset[selectedDay]))})`
    );

  groupsGauge
    .append("path")
    .attr(
      "d",
      `M -${dimensions.boundedWidth / 2} 0 a ${dimensions.boundedWidth / 2} ${
        dimensions.boundedWidth / 2
      } 0 0 1 ${dimensions.boundedWidth} 0`
    )
    .attr("stroke", "currentColor")
    .attr("stroke-width", strokeWidthGauge)
    .attr("fill", "none")
    .attr("opacity", 0.2)
    .attr("stroke-linecap", "round");

  groupsGauge
    .append("path")
    .attr(
      "d",
      `M -${dimensions.boundedWidth / 2} 0 a ${dimensions.boundedWidth / 2} ${
        dimensions.boundedWidth / 2
      } 0 0 1 ${dimensions.boundedWidth} 0`
    )
    .attr("stroke", (d) => `url(#linear-gradient-${d.key})`)
    .attr("stroke-width", strokeWidthGauge)
    .attr("fill", "none")
    .attr("opacity", 2)
    .attr("stroke-linecap", "round")
    .attr("stroke-dasharray", function () {
      return select(this).node().getTotalLength();
    })
    .attr("stroke-dashoffset", function (d) {
      return (
        select(this).node().getTotalLength() *
        d.scales.strokeDashoffset(d.accessor(dataset[selectedDay]))
      );
    });

  groupsGauge
    .append("circle")
    .attr("r", radiusCircle)
    .attr("cx", -dimensions.boundedWidth / 2)
    .attr("stroke-width", strokeWidthCircle)
    .attr("stroke", "currentColor")
    .attr("fill", (d) =>
      color(d.scales.fill(d.accessor(dataset[selectedDay]))).darker(1)
    )
    .attr(
      "transform",
      (d) => `rotate(${d.scales.rotate(d.accessor(dataset[selectedDay]))})`
    );

  articles
    .append("p")
    .html((d) => d.formatValue(d.accessor(dataset[selectedDay])));

  articles.append("p").text((d) => d.note);
}

drawDashboard();
