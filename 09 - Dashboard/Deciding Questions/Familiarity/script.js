const { json, format, extent, scaleLinear, scaleQuantize, select, color } = d3;

async function drawDashboard() {
  const dataset = await json("../../../nyc_weather_data.json");
  const selectedDay = dataset[Math.floor(Math.random() * dataset.length)];

  const formarValue = format(".1f");
  const qualifyRange = ["very low", "low", "average", "high", "very high"];
  const rotateRange = [0, 180];
  const strokeDashoffsetRange = [1, 0];

  const metricAccessor = (d) => d.dewPoint;
  const value = metricAccessor(selectedDay);
  const domain = extent(dataset, metricAccessor);

  const colorScale = scaleLinear()
    .domain(domain)
    .range(["hsl(21, 95%, 84%)", "hsl(34, 100%, 50%)"]);
  const rotateScale = scaleLinear().domain(domain).range(rotateRange);
  const qualifyScale = scaleQuantize().domain(domain).range(qualifyRange);
  const strokeDashoffsetScale = scaleLinear()
    .domain(domain)
    .range(strokeDashoffsetRange);

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

  const root = select("#root");
  const header = root.append("header");
  header.append("h2").text("Unfamiliar");
  header.append("h2").text("Familiar");

  function drawGauge(container) {
    const wrapper = container
      .append("svg")
      .attr("class", "gauge")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      .attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);

    const gradientId = `linear-gradient-${container.attr("id")}`;
    wrapper
      .append("defs")
      .append("linearGradient")
      .attr("id", gradientId)
      .selectAll("stop")
      .data(colorScale.range())
      .enter()
      .append("stop")
      .attr("offset", (d, i, { length }) => `${(i * 100) / (length - 1)}%`)
      .attr("stop-color", (d) => d);

    const bounds = wrapper
      .append("g")
      .style(
        "transform",
        `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
      );

    bounds
      .append("text")
      .attr("font-size", 18)
      .attr("fill", "currentColor")
      .text(qualifyScale(value))
      .attr("x", dimensions.boundedWidth / 2)
      .style("text-transform", "uppercase")
      .style("letter-spacing", "2px")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle");

    const groupGauge = bounds
      .append("g")
      .attr(
        "transform",
        `translate(${dimensions.boundedWidth / 2} ${dimensions.boundedHeight})`
      );

    groupGauge
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
      .attr("transform", `rotate(${rotateScale(value)})`);

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
      .attr("opacity", 0.2)
      .attr("stroke-linecap", "round");

    groupGauge
      .append("path")
      .attr(
        "d",
        `M -${dimensions.boundedWidth / 2} 0 a ${dimensions.boundedWidth / 2} ${
          dimensions.boundedWidth / 2
        } 0 0 1 ${dimensions.boundedWidth} 0`
      )
      .attr("stroke", `url(#${gradientId})`)
      .attr("stroke-width", strokeWidthGauge)
      .attr("fill", "none")
      .attr("opacity", 2)
      .attr("stroke-linecap", "round")
      .attr("stroke-dasharray", function () {
        return select(this).node().getTotalLength();
      })
      .attr("stroke-dashoffset", function () {
        return (
          select(this).node().getTotalLength() * strokeDashoffsetScale(value)
        );
      });

    groupGauge
      .append("circle")
      .attr("r", radiusCircle)
      .attr("cx", -dimensions.boundedWidth / 2)
      .attr("stroke-width", strokeWidthCircle)
      .attr("stroke", "currentColor")
      .attr("fill", color(colorScale(value)).darker(0.5))
      .attr("transform", `rotate(${rotateScale(value)})`);
  }

  (() => {
    const article = root.append("article").attr("id", "unfamiliar");

    article
      .append("h3")
      .html(
        '<svg width="1em" height="1em" viewBox="0 0 1 1"><use href="#icon-dewpoint" /></svg> Dew point'
      );

    drawGauge(article);

    article.append("p").attr("class", "value").text(formarValue(value));

    article.append("p").attr("class", "note").text("degrees to fahrenheit");

    const details = article.append("div").attr("class", "details");

    details
      .append("p")
      .html(
        "The <strong>dew point</strong> is maximum temperature at which the air is saturated with water vapor."
      );
    details
      .append("p")
      .text(
        "People are most comfortable when the dew point is between 24 and 60 °F."
      );
  })();

  (() => {
    const article = root.append("article").attr("id", "familiar");

    article
      .append("h3")
      .html(
        `<svg width="1em" height="1em" viewBox="0 0 1 1"><use href="#icon-dewpoint" /></svg> Dew point`
      );

    drawGauge(article);

    article.append("p").attr("class", "value").text(formarValue(value));

    article.append("p").attr("class", "note").text("degrees to fahrenheit");
  })();
}

drawDashboard();
