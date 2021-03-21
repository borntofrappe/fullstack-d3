async function drawDashboard() {
  const dataset = await d3.csv('../data_outliers.csv');
  const dateParser = d3.timeParse('%d-%m-%Y');
  const xAccessor = d => dateParser(d.date);
  const yAccessor = d => parseInt(d.views);

  function drawOutliers(data) {
    const dimensions = {
      width: 650,
      height: 200,
      margin: {
        top: 10,
        right: 10,
        bottom: 20,
        left: 50,
      },
    };

    dimensions.boundedWidth =
      dimensions.width - (dimensions.margin.left + dimensions.margin.right);
    dimensions.boundedHeight =
      dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

    const xScale = d3
      .scaleTime()
      .domain([
        d3.min(data, xAccessor),
        d3.timeDay.offset(d3.max(data, xAccessor), 1),
      ])
      .range([0, dimensions.boundedWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([d3.max(data, yAccessor), 0])
      .range([0, dimensions.boundedHeight])
      .nice();

    const wrapper = d3
      .select('#wrapper')
      .append('svg')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height);

    const bounds = wrapper
      .append('g')
      .style(
        'transform',
        `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
      );

    const axisGroup = bounds.append('g');
    const barsGroup = bounds.append('g');

    const barTotalWidth =
      xScale(xAccessor(dataset[1])) - xScale(xAccessor(dataset[0]));
    const barPadding = barTotalWidth * 0.1;
    const barWidth = barTotalWidth - barPadding * 2;

    const barGroups = barsGroup
      .selectAll('g')
      .data(data)
      .enter()
      .append('g')
      .attr(
        'transform',
        d => `translate(${xScale(xAccessor(d)) + barPadding} 0)`
      );

    barGroups
      .append('rect')
      .attr('fill', '#b2d48a')
      .attr('width', barWidth)
      .attr('y', d => yScale(yAccessor(d)))
      .attr('height', d => dimensions.boundedHeight - yScale(yAccessor(d)));

    const xAxisGenerator = d3
      .axisBottom()
      .scale(xScale)
      .ticks(5)
      .tickSize(0)
      .tickPadding(8);
    const yAxisGenerator = d3
      .axisLeft()
      .scale(yScale)
      .ticks(4)
      .tickSize(0)
      .tickPadding(6);

    axisGroup
      .append('g')
      .style('transform', `translate(0px, ${dimensions.boundedHeight}px)`)
      .call(xAxisGenerator);

    const yAxis = axisGroup.append('g').call(yAxisGenerator);

    axisGroup.selectAll('text').attr('font-size', 11);

    yAxis.select('path').remove();

    yAxis
      .selectAll('g.tick')
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', 'currentColor')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.2)
      .attr('d', `M 0 0 H ${dimensions.boundedWidth}`);
  }

  function cropOutliers(data) {
    const dimensions = {
      width: 650,
      height: 200,
      margin: {
        top: 40,
        right: 10,
        bottom: 20,
        left: 50,
      },
    };

    dimensions.boundedWidth =
      dimensions.width - (dimensions.margin.left + dimensions.margin.right);
    dimensions.boundedHeight =
      dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

    const xScale = d3
      .scaleTime()
      .domain([
        d3.min(data, xAccessor),
        d3.timeDay.offset(d3.max(data, xAccessor), 1),
      ])
      .range([0, dimensions.boundedWidth]);

    const mean = d3.mean(data, yAccessor);
    const standardDeviation = d3.deviation(data, yAccessor);
    const upperThreshold = mean + 1.5 * standardDeviation;

    const outliers = data.filter(d => yAccessor(d) > upperThreshold)
    const yScale = d3
      .scaleLinear()
      .domain([upperThreshold, 0])
      .range([0, dimensions.boundedHeight])
      .clamp(true);

    const wrapper = d3
      .select('#wrapper')
      .append('svg')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height);

    const bounds = wrapper
      .append('g')
      .style(
        'transform',
        `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
      );

    const axisGroup = bounds.append('g');
    const barsGroup = bounds.append('g');
    const outliersGroup = bounds.append('g')

    const barTotalWidth =
      xScale(xAccessor(dataset[1])) - xScale(xAccessor(dataset[0]));
    const barPadding = barTotalWidth * 0.1;
    const barWidth = barTotalWidth - barPadding * 2;

    const barGroups = barsGroup
      .selectAll('g')
      .data(data)
      .enter()
      .append('g')
      .attr(
        'transform',
        d => `translate(${xScale(xAccessor(d)) + barPadding} 0)`
      );

    barGroups
      .append('rect')
      .attr('fill', '#b2d48a')
      .attr('width', barWidth)
      .attr('y', d => yScale(yAccessor(d)))
      .attr('height', d => dimensions.boundedHeight - yScale(yAccessor(d)));

    const outlierGroups = outliersGroup
      .selectAll('g')
      .data(outliers)
      .enter()
      .append('g')
      .attr(
        'transform',
        d => `translate(${xScale(xAccessor(d))} 0)`
      );

    outlierGroups
      .append('rect')
      .attr('fill', '#b2d48a')
      .attr('width', barTotalWidth)
      .attr('y', -dimensions.margin.top / 2)
      .attr('height', dimensions.boundedHeight + dimensions.margin.top / 2)
      .attr('opacity', 0.25)

    outlierGroups
      .append('text')
      .text(d => `${yAccessor(d)} views`)
      .attr('font-size', 14)
      .attr('x', -5)
      .attr('y', -dimensions.margin.top + 16)
      .attr('text-anchor', 'end')


      outlierGroups
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', 'currentColor')
      .attr('stroke-width', 1)
      .attr('d', `M ${barTotalWidth / 2} ${-dimensions.margin.top / 2} v -8 h -5`);

    const xAxisGenerator = d3
      .axisBottom()
      .scale(xScale)
      .ticks(5)
      .tickSize(0)
      .tickPadding(8);
    const yAxisGenerator = d3
      .axisLeft()
      .scale(yScale)
      .ticks(4)
      .tickSize(0)
      .tickPadding(6);

    axisGroup
      .append('g')
      .style('transform', `translate(0px, ${dimensions.boundedHeight}px)`)
      .call(xAxisGenerator);

    const yAxis = axisGroup.append('g').call(yAxisGenerator);

    axisGroup.selectAll('text').attr('font-size', 11);

    yAxis.select('path').remove();

    yAxis
      .selectAll('g.tick')
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', 'currentColor')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.2)
      .attr('d', `M 0 0 H ${dimensions.boundedWidth}`);
  }

  drawOutliers(dataset.slice(0, 35));
  cropOutliers(dataset);
}

drawDashboard();
