const {
  csv,
  timeParse,
  timeFormat,
  format,
  scaleQuantize,
  scaleLinear,
  select,
  mean,
  color,
  extent,
} = d3;

async function drawDashboard() {
  const dataset = await csv("../data_feed.csv");
  const dateParser = timeParse("%d-%m-%Y");
  const dateFormatter = timeFormat("%B %-e");
  const dateAccessor = (d) => dateParser(d.date);
  const colors = ["#e8e9e9", "#29c86d"];

  let selectedDay = 0;
  const metrics = [
    {
      key: "views",
      accessor: (d) => parseInt(d.views),
      title: "Views",
      note: (qualifier, date) =>
        `There were <strong>${qualifier}</strong> views ${
          qualifier === "the same" ? "as usual" : "than usual"
        } on ${dateFormatter(date)}.`,
      addendum: (value) =>
        `People read articles related to <a href="#">Football</a> ${value} times. Every time someone reads an article, we count it as a view.`,
      formatAverage: (d) => `${format(".0f")(d / 1000)}k`,
      formatValue: (d) => `${format(".1f")(d / 1000)}k`,
    },
    {
      key: "articles",
      accessor: (d) => parseInt(d.articles),
      title: "Articles",
      note: (qualifier, date) =>
        `There were <strong>${qualifier}</strong> articles ${
          qualifier === "the same" ? "as usual" : "than usual"
        } on ${dateFormatter(date)}.`,
      addendum: (value) =>
        `There were ${value} articles read about <a href="#">Football</a>.`,
      formatAverage: (d) => `${format(".0f")(d)}`,
      formatValue: (d) => `${format(".0f")(d)}`,
    },
    {
      key: "demand",
      accessor: (d) => parseInt(d.views) / parseInt(d.articles),
      title: "Demand",
      note: (qualifier, date) =>
        `There was <strong>${qualifier}</strong> demand ${
          qualifier === "the same" ? "as usual" : "than usual"
        } on ${dateFormatter(date)}.`,
      addendum: (value) =>
        `On average people viewed an article related to <a href="#">Football</a> ${value} times. Demand is the average daily views per article`,
      formatAverage: (d) => `${format(".0f")(d)}`,
      formatValue: (d) => `${format(".1f")(d)}`,
    },
  ];

  metrics.forEach((metric) => {
    const domain = extent(dataset, metric.accessor);

    const qualifiers =
      metric.key === "demand"
        ? ["much less", "less", "the same", "more", "much more"]
        : ["many less", "less", "the same", "more", "many more"];
    metric.scales = {
      qualify: scaleQuantize().domain(domain).range(qualifiers),
      rotate: scaleLinear().domain(domain).range([0, 180]),
      fill: scaleLinear().domain(domain).range(colors),
      strokeDashoffset: scaleLinear().domain(domain).range([1, 0]),
    };
  });

  const wrapper = select("#wrapper");

  const sections = wrapper
    .selectAll("section")
    .data(metrics)
    .enter()
    .append("section")
    .attr("id", (d) => `section-${d.key}`);

  sections
    .append("svg")
    .attr("class", "icon")
    .attr("width", "1em")
    .attr("height", "1em")
    .attr("viewBox", "0 0 1 1")
    .append("use")
    .attr("fill", "currentColor")
    .attr("href", (d) => `#icon-${d.key}`);

  sections.append("h2").text((d) => d.title);
  sections
    .append("p")
    .attr("class", "note")
    .html((d) =>
      d.note(
        d.scales.qualify(d.accessor(dataset[selectedDay])),
        dateAccessor(dataset[selectedDay])
      )
    );

  sections
    .append("p")
    .attr("class", "addendum")
    .html((d) =>
      d.addendum(d.formatValue(d.accessor(dataset[selectedDay])), "Football")
    );

  const dimensions = {
    width: 150,
    height: 190,
    margin: {
      top: 30,
      right: 15,
      bottom: 60,
      left: 15,
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

  const svgs = sections
    .append("svg")
    .attr("class", "gauge")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height)
    .attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);

  svgs
    .append("defs")
    .append("linearGradient")
    .attr("id", (d) => `linear-gradient-${d.key}`)
    .selectAll("stop")
    .data(colors)
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
    .text("Historical Average")
    .attr("text-anchor", "middle")
    .attr("fill", "currentColor")
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", -dimensions.margin.top + 16);

  bounds
    .append("text")
    .text((d) => d.formatAverage(mean(dataset, (data) => data[d.key])))
    .attr("class", "average")
    .attr("text-anchor", "middle")
    .attr("fill", "currentColor")
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", -dimensions.margin.top + 38);

  bounds
    .append("text")
    .text((d) => d.formatValue(d.accessor(dataset[selectedDay])))
    .attr("class", "value")
    .attr("text-anchor", "middle")
    .attr("fill", "currentColor")
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", dimensions.boundedHeight + dimensions.margin.bottom - 5)
    .style("font-size", "2em")
    .style("letter-spacing", "1px")
    .style("font-weight", "900");

  const groupsGauge = bounds
    .append("g")
    .attr(
      "transform",
      `translate(${dimensions.boundedWidth / 2} ${dimensions.boundedHeight})`
    );

  groupsGauge
    .append("path")
    .attr("class", "arrow")
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
    .attr("class", "gauge-stroke")
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
    .append("path")
    .attr(
      "d",
      `M 0 ${-dimensions.boundedWidth / 2 - strokeWidthGauge / 2} v ${-10}`
    )
    .attr("stroke", "currentColor")
    .attr("stroke-width", 1)
    .attr("fill", "none");

  groupsGauge
    .append("circle")
    .attr("class", "bubble")
    .attr("r", radiusCircle)
    .attr("cx", -dimensions.boundedWidth / 2)
    .attr("fill", color(colors[0]).darker(1))
    .attr("stroke-width", strokeWidthCircle)
    .attr("stroke", (d) => color(colors[1]).darker(1.5))
    .attr(
      "transform",
      (d) => `rotate(${d.scales.rotate(d.accessor(dataset[selectedDay]))})`
    )
    .attr("fill", (d) =>
      color(d.scales.fill(d.accessor(dataset[selectedDay]))).darker(1)
    );


    wrapper
    .append("button")
    .text("Change Date")
    .on("click", () => {
      selectedDay = (selectedDay + 1) % dataset.length;

      sections
        .selectAll("p.note")
        .html((d) =>
          d.note(
            d.scales.qualify(d.accessor(dataset[selectedDay])),
            dateAccessor(dataset[selectedDay])
          )
        );

      sections
        .selectAll("p.addendum")
        .html((d) =>
          d.addendum(d.formatValue(d.accessor(dataset[selectedDay])), "Football")
        );

      sections
        .selectAll("text.value")
        .text((d) => d.formatValue(d.accessor(dataset[selectedDay])));

      sections
        .selectAll("path.arrow")
        .transition()
        .attr(
          "transform",
          (d) => `rotate(${d.scales.rotate(d.accessor(dataset[selectedDay]))})`
        );

      sections
        .selectAll("path.gauge-stroke")
        .transition()
        .attr("stroke-dashoffset", function (d) {
          return (
            select(this).node().getTotalLength() *
            d.scales.strokeDashoffset(d.accessor(dataset[selectedDay]))
          );
        });

      sections
        .selectAll("circle.bubble")
        .transition()
        .attr(
          "transform",
          (d) => `rotate(${d.scales.rotate(d.accessor(dataset[selectedDay]))})`
        )
        .attr("fill", (d) =>
          color(d.scales.fill(d.accessor(dataset[selectedDay]))).darker(1)
        );
    });
}

drawDashboard();
