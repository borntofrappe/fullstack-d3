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

  const root = select("#wrapper");

  function drawMetric(day, metric) {
    const { text, fill, rotate, strokeDashoffset } = metric.scales;
    const article = select(`#article-${metric.key}`);

    article.select(`h2`).text(metric.label);
    article.select(`h3`).text(metric.measure);

    const value = dataset[day][metric.key];
    article.select(`p`).html(metric.format(value));

    article.select("svg text").text(text(value));

    article
      .select("svg circle.bubble")
      .transition()
      .duration(400)
      .attr("transform", `rotate(${rotate(value)})`)
      .attr("fill", color(interpolateBlues(fill(value))).darker(1.5));

    article
      .select("svg path.arrow")
      .transition()
      .duration(400)
      .attr("transform", `rotate(${rotate(value)})`);

    article
      .select("svg path.gauge")
      .transition()
      .duration(400)
      .attr("stroke-dashoffset", function () {
        return select(this).node().getTotalLength() * strokeDashoffset(value);
      });
  }

  const metrics = [
    {
      key: "windSpeed",
      label: "Wind Speed",
      measure: "meters per second",
      format: (d) => format(".2f")(d),
      scales: {
        text: scaleQuantize().range([
          "Very low",
          "Low",
          "Average",
          "High",
          "Very high",
        ]),
        rotate: scaleLinear().range([0, 180]),
        fill: scaleLinear().range([0.2, 1]),
        strokeDashoffset: scaleLinear().range([1, 0]),
      },
    },
    {
      key: "visibility",
      label: "Visibility",
      measure: "kilometers",
      format: (d) => format(".2f")(d),
      scales: {
        text: scaleQuantize().range([
          "Very low",
          "Low",
          "Average",
          "High",
          "Very high",
        ]),
        rotate: scaleLinear().range([0, 180]),
        fill: scaleLinear().range([0.2, 1]),
        strokeDashoffset: scaleLinear().range([1, 0]),
      },
    },
    {
      key: "pressure",
      label: "Atmospheric Pressure",
      measure: "hectopascals",
      format: (d) => `${format(".2f")(d / 1000)}<span>k</span>`,
      scales: {
        text: scaleQuantize().range([
          "Very low",
          "Low",
          "Average",
          "High",
          "Very high",
        ]),
        rotate: scaleLinear().range([0, 180]),
        fill: scaleLinear().range([0.2, 1]),
        strokeDashoffset: scaleLinear().range([1, 0]),
      },
    },
  ];

  let selectedDay = 0;

  metrics.forEach((metric) => {
    const domain = extent(dataset, (d) => d[metric.key]);
    Object.keys(metric.scales).forEach((scale) =>
      metric.scales[scale].domain(domain)
    );

    const article = root.append("article").attr("id", `article-${metric.key}`);

    article.append("h2");
    article.append("h3");
    article.append("p");

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

    dimensions.boundedWidth =
      dimensions.width - (dimensions.margin.left + dimensions.margin.right);
    dimensions.boundedHeight =
      dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

    const wrapper = article
      .append("svg")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

    const gradientId = `linear-gradient-${metric.key}`;

    wrapper
      .append("defs")
      .append("linearGradient")
      .attr("id", gradientId)
      .selectAll("stop")
      .data(metric.scales.fill.range())
      .enter()
      .append("stop")
      .attr("offset", (d, i, { length }) => `${(i * 100) / (length - 1)}%`)
      .attr("stop-color", (d) => interpolateBlues(d));

    const bounds = wrapper
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
      .attr("y", -10);

    const strokeWidthCircle = 1;
    const radiusCircle = dimensions.margin.bottom - strokeWidthCircle / 2;
    const paddingGauge = 3;
    const strokeWidthGauge = (radiusCircle - paddingGauge) * 2;

    const groupGauge = bounds
      .append("g")
      .attr(
        "transform",
        `translate(${dimensions.boundedWidth / 2} ${dimensions.boundedHeight})`
      );
    groupGauge
      .append("path")
      .attr("class", "arrow")
      .attr("d", "M 0 -8 a 8 8 0 0 1 0 16 q -6 0 -16 -8 10 -8 16 -8z")
      .attr("fill", "currentColor")
      .attr("stroke", "currentColor")
      .attr("stroke-width", "4")
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .attr("transform", "rotate(180)");

    groupGauge
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

    groupGauge
      .append("path")
      .attr("class", "gauge")
      .attr(
        "d",
        `M -${dimensions.boundedWidth / 2} 0 a ${dimensions.boundedWidth / 2} ${
          dimensions.boundedWidth / 2
        } 0 0 1 ${dimensions.boundedWidth} 0`
      )
      .attr("stroke", `url(#${gradientId})`)
      .attr("stroke-width", strokeWidthGauge)
      .attr("fill", "none")
      .attr("stroke-linecap", "round")
      .attr("stroke-dasharray", function () {
        return select(this).node().getTotalLength();
      })
      .attr("stroke-dashoffset", function () {
        return select(this).node().getTotalLength() * 0;
      });

    groupGauge
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

    groupGauge
      .append("circle")
      .attr("class", "bubble")
      .attr("r", radiusCircle)
      .attr("cx", -dimensions.boundedWidth / 2)
      .attr("fill", color(interpolateBlues(1)).darker(1.5))
      .attr("stroke-width", strokeWidthCircle)
      .attr("stroke", color(interpolateBlues(1)).darker(2))
      .attr("transform", "rotate(180)");

    drawMetric(selectedDay, metric);
  });

  root
    .append("button")
    .text("Change Date")
    .on("click", () => {
      selectedDay = (selectedDay + 1) % dataset.length;

      metrics.forEach((metric) => drawMetric(selectedDay, metric));
    });
}

drawDashboard();
