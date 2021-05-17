const {
  csv,
  timeParse,
  scaleTime,
  extent,
  min,
  max,
  line,
  area,
  scaleLinear,
  curveCatmullRom,
  select,
  axisBottom,
  axisLeft
} = d3;

async function drawDashboard() {
  const dataset = await csv('./data_outliers.csv');
  const dateParser = timeParse('%d-%m-%Y');
  const xAccessor = d => dateParser(d.date);
  const yAccessor = d => parseInt(d.views);
  const articlesAccessor = d => parseInt(d.articles);

  const dimensions = {
    width: 600,
    height: 300,
    margin: {
      top: 10,
      right: 30,
      bottom: 20,
      left: 50,
    },
  };

  dimensions.boundedWidth =
    dimensions.width - (dimensions.margin.left + dimensions.margin.right);
  dimensions.boundedHeight =
    dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

  const xScale = scaleTime()
    .domain(extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth]);

  const yScale = scaleLinear()
    .domain([max(dataset, yAccessor), 0])
    .range([0, dimensions.boundedHeight])
    .nice();

  const lineGenerator = line()
    .x(d => xScale(xAccessor(d)))
    .y(d => yScale(yAccessor(d)))
    .curve(curveCatmullRom);

  const areaGenerator = area()
    .x(d => xScale(xAccessor(d)))
    .y0(d => yScale(yAccessor(d)))
    .y1(dimensions.boundedHeight)
    .curve(curveCatmullRom);

  const wrapper = select('#wrapper')
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
  const viewsGroup = bounds.append('g');
  const articlesGroup = bounds.append('g');
  const outliersGroup = bounds.append('g');

  viewsGroup
    .append('path')
    .attr('fill', 'hsl(236, 70%, 96%)')
    .attr('d', areaGenerator(dataset));

  viewsGroup
    .append('path')
    .attr('fill', 'none')
    .attr('stroke', 'hsl(263, 50%, 42%)')
    .attr('stroke-width', 2.5)
    .attr('d', lineGenerator(dataset));

  const width = xScale(xAccessor(dataset[1])) - xScale(xAccessor(dataset[0]));
  const radius = min([(width / 2) * 0.9, 2]);

  const articleGroups = articlesGroup
    .selectAll('g')
    .data(dataset)
    .enter()
    .append('g')
    .attr(
      'transform',
      d =>
        `translate(${xScale(xAccessor(d))} ${dimensions.boundedHeight -
          radius})`
    );

  const maxHeightFraction = 1 / 3;
  const maxCircles = Math.floor(
    (dimensions.boundedHeight / (width / 2)) * maxHeightFraction
  );
  articleGroups
    .selectAll('circle')
    .data(d =>
      Array(min([articlesAccessor(d), maxCircles]))
        .fill()
        .map((datum, i) => ((i * width) / 2) * -1)
    )
    .enter()
    .append('circle')
    .attr('cy', d => d)
    .attr('r', radius)
    .attr('fill', 'hsl(243, 29%, 75%)');

  const outliers = dataset.filter(d => articlesAccessor(d) > maxCircles);
  const outlierGroups = outliersGroup
    .selectAll('g')
    .data(outliers)
    .enter()
    .append('g')
    .attr(
      'transform',
      d =>
        `translate(${xScale(xAccessor(d))} ${dimensions.boundedHeight -
          dimensions.boundedHeight * maxHeightFraction +
          width / 2 -
          radius})`
    );

  outlierGroups
    .append('path')
    .attr('d', 'M -3 0 l 3 -4 3 4z')
    .attr('stroke', 'hsl(243, 29%, 75%)')
    .attr('stroke-width', 2)
    .attr('stroke-linecap', 'round')
    .attr('stroke-linejoin', 'round')
    .attr('fill', 'hsl(243, 29%, 75%)');

  const xAxisGenerator = axisBottom()
    .scale(xScale)
    .ticks(5)
    .tickSize(0)
    .tickPadding(8);

  const yAxisGenerator = axisLeft()
    .scale(yScale)
    .ticks(6)
    .tickSize(0)
    .tickPadding(6);

  const xAxis = axisGroup
    .append('g')
    .style('transform', `translate(0px, ${dimensions.boundedHeight}px)`)
    .call(xAxisGenerator);

  const yAxis = axisGroup.append('g').call(yAxisGenerator);

  axisGroup.selectAll('text').attr('font-size', 11);

  xAxis.select('path').remove();
  yAxis.select('path').remove();
}

drawDashboard();
