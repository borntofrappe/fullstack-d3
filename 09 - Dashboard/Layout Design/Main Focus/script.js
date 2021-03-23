async function drawDashboard() {
  const dataset = await d3.json('../../../nyc_weather_data.json');
  const selectedDay =
    dataset[Math.floor(Math.random() * (dataset.length - 31) + 31)];

  const dateParser = d3.timeParse('%Y-%m-%d');
  const dateFormatter = d3.timeFormat('%B %-d, %Y');
  const dateAccessor = d => dateParser(d.date);
  const temperatureFormatter = d3.format('.1f');

  const root = d3.select('#root');
  const header = root.append('header');
  header.append('h1').text('Weather in New York City');
  header.append('h2').text(dateFormatter(dateAccessor(selectedDay)));
  header
    .append('h3')
    .text(
      `Maximum temperature ${temperatureFormatter(
        selectedDay.temperatureMax
      )}, minimum temperature ${temperatureFormatter(
        selectedDay.temperatureMin
      )}`
    );

  const monthData = dataset.filter(
    d =>
      dateAccessor(d) > d3.timeMonth.offset(dateAccessor(selectedDay), -1) &&
      dateAccessor(d) <= dateAccessor(selectedDay)
  );

  function drawTimeline() {
    const dimensions = {
      width: 700,
      height: 250,
      margin: {
        top: 5,
        right: 10,
        bottom: 20,
        left: 0,
      },
    };

    dimensions.boundedWidth =
      dimensions.width - (dimensions.margin.left + dimensions.margin.right);
    dimensions.boundedHeight =
      dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(monthData, dateAccessor))
      .range([0, dimensions.boundedWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([d3.max(monthData, d => d.temperatureMax), 0])
      .range([0, dimensions.boundedHeight])
      .nice();

    const lineMinGenerator = d3
      .line()
      .x(d => xScale(dateAccessor(d)))
      .y(d => yScale(d.temperatureMin))
      .curve(d3.curveCatmullRom);

    const lineMaxGenerator = d3
      .line()
      .x(d => xScale(dateAccessor(d)))
      .y(d => yScale(d.temperatureMax))
      .curve(d3.curveCatmullRom);

    const areaGenerator = d3
      .area()
      .x(d => xScale(dateAccessor(d)))
      .y0(d => yScale(d.temperatureMax))
      .y1(d => yScale(d.temperatureMin))
      .curve(d3.curveCatmullRom);

    const wrapper = root
      .append('svg')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .attr('viewBox', [0, 0, dimensions.width, dimensions.height]);

    const bounds = wrapper
      .append('g')
      .style(
        'transform',
        `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
      );

    const monthGroup = bounds.append('g');
    const axisGroup = bounds.append('g');

    monthGroup
      .append('path')
      .attr('fill', 'hsl(0, 0%, 93%)')
      .attr('d', areaGenerator(monthData));

    monthGroup
      .append('path')
      .attr('fill', 'none')
      .attr('stroke-width', 3)
      .attr('stroke', 'hsl(220, 96%, 64%)')
      .attr('d', lineMinGenerator(monthData));

    monthGroup
      .append('path')
      .attr('fill', 'none')
      .attr('stroke-width', 3)
      .attr('stroke', 'hsl(0, 86%, 59%)')
      .attr('d', lineMaxGenerator(monthData));

    const selectedDayGroup = monthGroup
      .append('g')
      .attr('transform', `translate(${xScale(dateAccessor(selectedDay))} 0)`);

    selectedDayGroup
      .append('circle')
      .attr('r', 5)
      .attr('cy', yScale(selectedDay.temperatureMin))
      .attr('fill', 'hsl(220, 96%, 64%)');

    selectedDayGroup
      .append('circle')
      .attr('r', 5)
      .attr('cy', yScale(selectedDay.temperatureMax))
      .attr('fill', 'hsl(0, 86%, 59%)');

    const xAxisGenerator = d3
      .axisBottom()
      .scale(xScale)
      .ticks(4)
      .tickSize(0)
      .tickPadding(8);

    const yAxisGenerator = d3
      .axisLeft()
      .scale(yScale)
      .ticks(3)
      .tickSize(0);

    const xAxisGroup = axisGroup
      .append('g')
      .style('transform', `translate(0px, ${dimensions.boundedHeight}px)`)
      .call(xAxisGenerator);

    const yAxisGroup = axisGroup.append('g').call(yAxisGenerator);

    axisGroup.selectAll('g.tick text').attr('font-size', 10);

    xAxisGroup.select('path').remove();
    yAxisGroup.select('path').remove();

    yAxisGroup
      .selectAll('g.tick text')
      .attr('text-anchor', 'start')
      .attr('x', 5);
  }

  drawTimeline();
}

drawDashboard();
