const {
  json,
  timeParse,
  timeMonth,
  extent,
  scaleQuantize,
  scaleLinear,
  format,
  select,
  forceSimulation,
  forceCollide,
  forceX,
  forceY,
  axisBottom,
  color,
  mean,
} = d3;

async function drawDashboard() {
  const dataset = await json("../../../nyc_weather_data.json");
  const selectedDay =
    dataset[Math.floor(Math.random() * (dataset.length - 31) + 31)];

  const icons = {
    dewPoint: `<svg width="1em" height="1em" aria-focusable="false" aria-hidden="true" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="m49.78 5.074a5 5 0 0 0-2.369 0.7168 5 5 0 0 0-0.4141 0.2793 5 5 0 0 0-1.32 1.484 5 5 0 0 0-0.2305 0.4434 5 5 0 0 0-0.1836 0.4648 5 5 0 0 0-0.1367 0.4805 5 5 0 0 0-0.08789 0.4922 5 5 0 0 0-0.04102 0.5645c0 5.25-1.426 8.7-3.746 11.92-2.32 3.222-5.705 6.111-9.455 9.236s-7.865 6.486-11.17 11.08c-3.305 4.59-5.629 10.52-5.629 17.77 0 19.27 15.73 35 35 35s35-15.73 35-35c0-7.25-2.324-13.18-5.629-17.77-3.305-4.59-7.42-7.951-11.17-11.08s-7.135-6.014-9.455-9.236c-2.32-3.222-3.746-6.672-3.746-11.92a5 5 0 0 0-0.03125-0.498 5 5 0 0 0-0.3906-1.443 5 5 0 0 0-0.7988-1.264 5 5 0 0 0-0.3457-0.3594 5 5 0 0 0-0.3809-0.3262 5 5 0 0 0-0.8477-0.5273 5 5 0 0 0-0.459-0.1973 5 5 0 0 0-0.4766-0.1504 5 5 0 0 0-0.4902-0.1035 5 5 0 0 0-0.4961-0.05273 5 5 0 0 0-0.5-0.00391zm0.2168 21.67c0.2187 0.3302 0.4004 0.7041 0.6289 1.021 3.305 4.59 7.42 7.951 11.17 11.08s7.135 6.014 9.455 9.236c2.32 3.222 3.746 6.672 3.746 11.92 0 13.87-11.13 25-25 25s-25-11.13-25-25c0-5.25 1.426-8.7 3.746-11.92 2.32-3.222 5.705-6.111 9.455-9.236s7.865-6.486 11.17-11.08c0.2285-0.3174 0.4102-0.6913 0.6289-1.021z"/>
   </svg>
   `,
  };

  const dateParser = timeParse("%Y-%m-%d");
  const dateAccessor = (d) => dateParser(d.date);

  const monthData = dataset.filter(
    (d) =>
      dateAccessor(d) > timeMonth.offset(dateAccessor(selectedDay), -1) &&
      dateAccessor(d) <= dateAccessor(selectedDay)
  );

  const metricAccessor = (d) => d.dewPoint;
  const value = metricAccessor(selectedDay);
  const domain = extent(monthData, metricAccessor);

  const qualifyRange = ["very low", "low", "average", "high", "very high"];
  const qualifyScale = scaleQuantize().domain(domain).range(qualifyRange);

  const formatValue = format(".1f");

  const root = select("#root");

  function drawDetails() {
    const radiusAccessor = (d) => d.cloudCover;
    const radiusRange = [2, 20];

    const radiusScale = scaleLinear()
      .domain(extent(monthData, radiusAccessor))
      .range(radiusRange);

    const xScale = scaleLinear().domain(domain).nice();

    const article = root.append("article").attr("id", "details");
    article.append("h3").html(`${icons.dewPoint} Dew point`);
    article.append("h4").html("This month");

    const dimensions = {
      width: 500,
      height: 200,
      margin: {
        top: 30,
        right: 40,
        bottom: 20,
        left: 40,
      },
    };

    dimensions.boundedWidth =
      dimensions.width - (dimensions.margin.left + dimensions.margin.right);
    dimensions.boundedHeight =
      dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

    xScale.range([0, dimensions.boundedWidth]);

    const wrapper = article
      .append("svg")
      .attr("id", "packing")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      .attr("viewBox", [0, 0, dimensions.width, dimensions.height]);

    const bounds = wrapper
      .append("g")
      .style(
        "transform",
        `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
      );

    const axisGroup = bounds.append("g");
    const averageGroup = bounds.append("g");
    const monthGroup = bounds.append("g");
    const valueGroup = bounds.append("g");

    const simulationData = [...monthData];

    const circleMargin = 3;
    const tick = 100;

    forceSimulation(simulationData)
      .force(
        "collision",
        forceCollide().radius(
          (d) => radiusScale(radiusAccessor(d)) + circleMargin
        )
      )
      .force(
        "x",
        forceX().x((d) => xScale(metricAccessor(d)))
      )
      .force("y", forceY().y(dimensions.boundedHeight / 2))
      .tick(tick);

    monthGroup
      .selectAll("circle")
      .data(simulationData)
      .enter()
      .append("circle")
      .attr("fill", "cornflowerblue")
      .attr("r", (d) => radiusScale(radiusAccessor(d)))
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y);

    // bounds
    // .append('g')
    // .selectAll('circle')
    // .data(monthData)
    // .enter()
    // .append('circle')
    // .attr('fill', 'red')
    // .attr('r', d => radiusScale(radiusAccessor(d)))
    // .attr('cx', d => xScale(metricAccessor(d)))
    // .attr('cy', dimensions.boundedHeight / 2)
    // .attr('opacity', 0.5)

    const [averageStart, averageEnd] = qualifyScale.invertExtent("average");
    const isAverageStartLeft =
      xScale(averageStart) < dimensions.boundedWidth / 2;
    const averageWidth = xScale(averageEnd) - xScale(averageStart);

    averageGroup.attr("transform", `translate(${xScale(averageStart)} 0)`);

    averageGroup
      .append("rect")
      .attr("width", averageWidth)
      .attr("height", dimensions.boundedHeight)
      .attr("fill", "currentColor")
      .attr("opacity", 0.1);

    averageGroup
      .append("text")
      .text("average range")
      .attr("class", "color-sub")
      .attr("font-size", 12)
      .attr("font-weight", 500)
      .attr("x", isAverageStartLeft ? averageWidth + 5 : -5)
      .attr("y", 12)
      .attr("text-anchor", isAverageStartLeft ? "start" : "end");

    valueGroup.attr(
      "transform",
      `translate(${xScale(value)} ${dimensions.boundedHeight})`
    );

    const isValueLeft = xScale(value) < dimensions.boundedWidth / 2;
    valueGroup
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "hsl(34, 100%, 50%)")
      .attr("stroke-width", 2)
      .attr(
        "d",
        `M 0 0 v -${dimensions.boundedHeight + dimensions.margin.top / 2} h ${
          isValueLeft ? 10 : -10
        }`
      );

    const valueText = valueGroup
      .append("text")
      .attr("x", isValueLeft ? 15 : -15)
      .attr("y", -dimensions.boundedHeight - dimensions.margin.top / 2)
      .attr("text-anchor", isValueLeft ? "start" : "end")
      .attr("dominant-baseline", "middle");

    valueText
      .append("tspan")
      .text(`${qualifyScale(value)}: `)
      .style("text-transform", "capitalize")
      .attr("font-size", 14)
      .attr("class", "color-sub")
      .attr("font-weight", 500);

    valueText
      .append("tspan")
      .text(`${formatValue(value)} °F`)
      .attr("font-size", 18)
      .attr("font-weight", 900);

    const xAxisGenerator = axisBottom()
      .scale(xScale)
      .ticks(4)
      .tickSize(0)
      .tickPadding(8)
      .tickFormat((d) => `${d}°F`);

    const xAxisGroup = axisGroup
      .append("g")
      .style("transform", `translate(0px, ${dimensions.boundedHeight}px)`)
      .call(xAxisGenerator);

    axisGroup.selectAll("g.tick text").attr("font-size", 12);

    xAxisGroup.select("path").remove();
  }

  function drawHits() {
    const colorRange = ["hsl(21, 95%, 84%)", "hsl(34, 100%, 50%)"];
    const rotateRange = [0, 180];
    const strokeDashoffsetRange = [1, 0];

    const colorScale = scaleLinear().domain(domain).range(colorRange);
    const rotateScale = scaleLinear().domain(domain).range(rotateRange);

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

    const article = root.append("article").attr("id", "hits");
    article.append("h3").html(`${icons.dewPoint} Dew point`);
    article.append("h4").html("This month");

    const wrapper = article
      .append("svg")
      .attr("class", "gauge")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      .attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);

    const gradientId = `linear-gradient-familiar`;
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

    article
      .append("p")
      .attr("class", "value")
      .html(`${formatValue(value)}<span>°F</span>`);

    const average = mean(monthData, metricAccessor);
    const difference = value - average;
    article
      .append("p")
      .attr("class", "note")
      .html(
        `<span style="color: ${
          colorScale.range()[1]
        }; font-weight: 700;">${formatValue(difference)}°F</span> ${
          difference > 0 ? "higher" : "lower"
        } than normal`
      );
  }

  drawDetails();
  drawHits();
}

drawDashboard();
