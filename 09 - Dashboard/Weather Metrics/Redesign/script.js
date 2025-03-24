const {
  json,
  select,
  color,
  interpolateBlues,
  format,
  scaleQuantize,
  scaleLinear,
  extent,
} = d3;

async function drawDashboard() {
  const dataset = await json("../../../nyc_weather_data.json");
  const fillRange = [0.2, 1];

  let selectedDay = 0;
  const metrics = [
    {
      key: "windSpeed",
      label: "Wind Speed",
      measure: "meters per second",
      format: (d) => format(".2f")(d),
    },
    {
      key: "visibility",
      label: "Visibility",
      measure: "kilometers",
      format: (d) => format(".2f")(d),
    },
    {
      key: "pressure",
      label: "Atmospheric Pressure",
      measure: "hectopascals",
      format: (d) => `${format(".2f")(d / 1000)}<span>k</span>`,
    },
  ];

  metrics.forEach((metric) => {
    const domain = extent(dataset, (d) => d[metric.key]);

    metric.scales = {
      text: scaleQuantize()
        .domain(domain)
        .range(["Very low", "Low", "Average", "High", "Very high"]),
      rotate: scaleLinear().domain(domain).range([0, 180]),
      fill: scaleLinear().domain(domain).range(fillRange),
      strokeDashoffset: scaleLinear().domain(domain).range([1, 0]),
    };
  });

  const wrapper = select("#wrapper");
  const articles = wrapper
    .selectAll("article")
    .data(metrics)
    .enter()
    .append("article")
    .attr("id", (d) => `article-${d.key}`);

  articles.append("h2").text((d) => d.label);
  articles.append("h3").text((d) => d.measure);
  articles.append("p").html((d) => d.format(dataset[selectedDay][d.key]));

  const dimensions = {
    width: 150,
    height: 125,
    margin: {
      top: 30,
      right: 15,
      bottom: 15,
      left: 15,
    },
  };

  const strokeWidthCircle = 1;
  const radiusCircle = dimensions.margin.bottom - strokeWidthCircle / 2;
  const paddingGauge = 3;
  const strokeWidthGauge = (radiusCircle - paddingGauge) * 2;

  dimensions.boundedWidth =
    dimensions.width - (dimensions.margin.left + dimensions.margin.right);
  dimensions.boundedHeight =
    dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

  const svgs = articles
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  svgs
    .append("defs")
    .append("linearGradient")
    .attr("id", (d) => `linear-gradient-${d.key}`)
    .selectAll("stop")
    .data(fillRange)
    .enter()
    .append("stop")
    .attr("offset", (d, i, { length }) => `${(i * 100) / (length - 1)}%`)
    .attr("stop-color", (d) => interpolateBlues(d));

  const bounds = svgs
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
    );

  bounds
    .append("text")
    .attr("class", "label")
    .attr("text-anchor", "middle")
    .attr("fill", "currentColor")
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", -10)
    .text((d) => d.scales.text(dataset[selectedDay][d.key]));

  const groupsGauge = bounds
    .append("g")
    .attr(
      "transform",
      `translate(${dimensions.boundedWidth / 2} ${dimensions.boundedHeight})`
    );

  groupsGauge
    .append("path")
    .attr("class", "arrow")
    .attr("d", "M 0 -8 a 8 8 0 0 1 0 16 q -6 0 -16 -8 10 -8 16 -8z")
    .attr("fill", "currentColor")
    .attr("stroke", "currentColor")
    .attr("stroke-width", "4")
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .attr(
      "transform",
      (d) => `rotate(${d.scales.rotate(dataset[selectedDay][d.key])})`
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
    .attr("opacity", "0.4")
    .attr("stroke-linecap", "round");

  groupsGauge
    .append("path")
    .attr("class", "gauge")
    .attr(
      "d",
      `M -${dimensions.boundedWidth / 2} 0 a ${dimensions.boundedWidth / 2} ${
        dimensions.boundedWidth / 2
      } 0 0 1 ${dimensions.boundedWidth} 0`
    )
    .attr("stroke", (d) => `url(#linear-gradient-${d.key})`)
    .attr("stroke-width", strokeWidthGauge)
    .attr("fill", "none")
    .attr("stroke-linecap", "round")
    .attr("stroke-dasharray", function () {
      return select(this).node().getTotalLength();
    })
    .attr("stroke-dashoffset", function (d) {
      return (
        select(this).node().getTotalLength() *
        d.scales.strokeDashoffset(dataset[selectedDay][d.key])
      );
    });

  groupsGauge
    .append("path")
    .attr(
      "d",
      `M 0 ${
        -dimensions.boundedWidth / 2 - strokeWidthGauge / 2
      } v ${strokeWidthGauge}`
    )
    .attr("stroke", "white")
    .attr("stroke-width", "1")
    .attr("fill", "none");

  groupsGauge
    .append("circle")
    .attr("class", "bubble")
    .attr("r", radiusCircle)
    .attr("cx", -dimensions.boundedWidth / 2)
    .attr("stroke-width", strokeWidthCircle)
    .attr("stroke", color(interpolateBlues(1)).darker(2))
    .attr("fill", (d) =>
      color(
        interpolateBlues(d.scales.fill(dataset[selectedDay][d.key]))
      ).darker(1.5)
    )
    .attr(
      "transform",
      (d) => `rotate(${d.scales.rotate(dataset[selectedDay][d.key])})`
    );

  wrapper
    .append("button")
    .text("Change Date")
    .on("click", () => {
      selectedDay = (selectedDay + 1) % dataset.length;

      articles.select("p").html((d) => d.format(dataset[selectedDay][d.key]));

      articles
        .selectAll("text.label")
        .text((d) => d.scales.text(dataset[selectedDay][d.key]));

      articles
        .selectAll("path.arrow")
        .transition()
        .attr(
          "transform",
          (d) => `rotate(${d.scales.rotate(dataset[selectedDay][d.key])})`
        );

      articles
        .selectAll("path.gauge")
        .transition()
        .attr("stroke-dashoffset", function (d) {
          return (
            select(this).node().getTotalLength() *
            d.scales.strokeDashoffset(dataset[selectedDay][d.key])
          );
        });

      articles
        .selectAll("circle.bubble")
        .transition()
        .attr("fill", (d) =>
          color(
            interpolateBlues(d.scales.fill(dataset[selectedDay][d.key]))
          ).darker(1.5)
        )
        .attr(
          "transform",
          (d) => `rotate(${d.scales.rotate(dataset[selectedDay][d.key])})`
        );
    });
}

drawDashboard();
