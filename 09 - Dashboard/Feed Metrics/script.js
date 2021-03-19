async function drawDashboard() {
  const dataset = await d3.csv('./data_feed.csv');
  const dateParser = d3.timeParse('%d-%m-%Y');
  const dateFormatter = d3.timeFormat('%B %-e');

  const iconsPaths = {
    views:
      'm29 2c-15.97 0-29 13.03-29 29s13.03 29 29 29c7.322 0 14.02-2.745 19.14-7.252a2 2 0 0 0 0.4492 0.666l1.512 1.512a4 4 0 0 0 1.074 3.902l18 18a4 4 0 1 0 5.656-5.656l-18-18a4 4 0 0 0-2.869-1.213 4 4 0 0 0-1.031 0.1406l-1.514-1.514a2 2 0 0 0-0.666-0.4512c4.506-5.114 7.252-11.81 7.252-19.13 0-15.97-13.03-29-29-29zm30 0a4 4 0 1 0 0 8h27c3.361 0 6 2.639 6 6v68c0 3.361-2.639 6-6 6h-54c-3.361 0-6-2.639-6-6v-15a4 4 0 1 0-8 0v15c0 7.685 6.315 14 14 14h54c7.685 0 14-6.315 14-14v-68c0-7.385-5.848-13.44-13.12-13.91a4 4 0 0 0-0.877-0.08984h-27zm-30 8c11.65 0 21 9.355 21 21s-9.355 21-21 21-21-9.355-21-21 9.355-21 21-21zm9 14.5a3.5 3.5 0 1 0 0 7h4a3.5 3.5 0 1 0 0-7h-4zm28 0a3.5 3.5 0 1 0 0 7h12a3.5 3.5 0 1 0 0-7h-12zm-3 20a3.5 3.5 0 1 0 0 7h15a3.5 3.5 0 1 0 0-7h-15zm-25 20a3.5 3.5 0 1 0 0 7h12a3.5 3.5 0 1 0 0-7h-12z',
    articles:
      'm14 2c-7.685 0-14 6.315-14 14v68c0 7.685 6.315 14 14 14h54c7.685 0 14-6.315 14-14v-17.5a4 4 0 1 0-8 0v17.5c0 3.361-2.639 6-6 6h-54c-3.361 0-6-2.639-6-6v-68c0-3.361 2.639-6 6-6h52.5a4 4 0 1 0 0-8h-52.5zm64.96 6.459a4 4 0 0 0-0.03711 0.001953 4 4 0 0 0-0.001953 0 4 4 0 0 0-3.201 1.664l-37.55 37.55a4 4 0 0 0-1.172 2.828v17a4 4 0 0 0 4 4h17a4 4 0 0 0 2.828-1.172l38-38a4 4 0 0 0 0-5.656l-16.54-16.54a4 4 0 0 0-3.24-1.672 4 4 0 0 0-0.0918-0.003906zm0.04102 9.697 11.34 11.34-3.697 3.697-11.34-11.34 3.697-3.697zm-59 6.344a3.5 3.5 0 1 0 0 7h25a3.5 3.5 0 1 0 0-7h-25zm50.35 2.303 11.34 11.34-25.35 25.35h-11.34v-11.34l25.35-25.35zm-50.35 17.7a3.5 3.5 0 1 0 0 7h10a3.5 3.5 0 1 0 0-7h-10zm0 20a3.5 3.5 0 1 0 0 7h10a3.5 3.5 0 1 0 0-7h-10z',
    demand:
      'm35.23 0a5.87 5.87 0 0 0-4.311 9.74c1.333 1.511 2.515 3.013 3.689 4.514 1.499 2.327 2.18 4.41 2.18 6.277 0 2.935-1.418 6.324-5.617 10.52-10.47 10.47-16.39 21.76-16.39 33.5a5.87 5.87 0 0 0 0 2e-3c0.0036 19.38 15.84 35.21 35.22 35.21 18.95 0 34.4-15.16 35.09-33.95a5.87 5.87 0 0 0 0.1289-1.266 5.87 5.87 0 0 0 0-0.0039 5.87 5.87 0 0 0-0.05859-0.8477c-0.1511-9.449-2.811-19.69-7.785-30.88a5.87 5.87 0 0 0-11.15 1.42c-1.119 6.711-3.067 11.23-5.139 13.71-0.3644 0.4373-0.761 0.5826-1.125 0.9258-0.2389-14.38-5.739-28.46-16.02-41.73-1.149-1.678-2.451-3.31-3.961-4.873-0.08754-0.09994-0.158-0.2029-0.2461-0.3027l-0.0098 0.0098c-0.08808-0.08957-0.1511-0.1882-0.2402-0.2773a5.87 5.87 0 0 0-4.242-1.705zm9.795 32.14c3.046 8.034 3.965 16.07 2.826 24.27a5.87 5.87 0 0 0 5.812 6.678c6.359 0 12.39-2.764 16.43-7.615 0.679-0.8148 1.244-1.742 1.83-2.648 1.02 4.253 1.549 8.185 1.549 11.73-0.002406 13.03-10.44 23.47-23.48 23.47s-23.48-10.44-23.48-23.47c0-7.826 3.864-16.11 12.96-25.2 2.269-2.269 4.072-4.7 5.553-7.213z',
  };

  const metrics = [
    {
      key: 'views',
      label: 'Views',
      value: 'views to articles',
      note: (value, topic) =>
        `People read articles related to <a href="#">${topic}</a> ${value} times. Every time someone reads an article, we count it as a view.`,
      formatAverage: d => `${d3.format('.0f')(d / 1000)}k`,
      formatValue: d => `${d3.format('.1f')(d / 1000)}k`,
      scales: {
        text: d3
          .scaleQuantize()
          .range(['many less', 'less', 'the same', 'more', 'many more']),
        rotate: d3.scaleLinear().range([0, 180]),
        fill: d3.scaleLinear().range(['#e8e9e9', '#29c86d']),
        strokeDashoffset: d3.scaleLinear().range([1, 0]),
      },
    },

    {
      key: 'articles',
      label: 'Articles',
      value: 'number of articles viewed',
      note: (value, topic) =>
        `There were ${value} articles read about <a href="#">${topic}</a>.`,
      formatAverage: d => `${d3.format('.0f')(d)}`,
      formatValue: d => `${d3.format('.0f')(d)}`,
      scales: {
        text: d3
          .scaleQuantize()
          .range(['many less', 'less', 'the same', 'more', 'many more']),
        rotate: d3.scaleLinear().range([0, 180]),
        fill: d3.scaleLinear().range(['#e8e9e9', '#29c86d']),
        strokeDashoffset: d3.scaleLinear().range([1, 0]),
      },
    },
  ];

  const root = d3.select('#wrapper');

  function drawMetric(day, metric) {
    const { text, fill, rotate, strokeDashoffset } = metric.scales;
    const metricAccessor = d => parseInt(d[metric.key]);
    const average = d3.mean(dataset, metricAccessor);
    const value = metricAccessor(dataset[day]);

    const section = d3.select(`#section-${metric.key}`);
    section
      .select('p:nth-of-type(1)')
      .html(
        `There were <strong>${text(value)}</strong> ${metric.value} <em>${
          text(value) === 'the same' ? 'as usual' : 'than usual'
        }</em> on ${dateFormatter(dateParser(dataset[day].date))}`
      );

    section
      .select('p:nth-of-type(2)')
      .html(metric.note(metric.formatValue(value), 'Football'));

    section.select('svg text.average').text(metric.formatAverage(average));
    section.select('svg text.value').text(metric.formatValue(value));

    section
      .select('svg circle.bubble')
      .attr('transform', `rotate(${rotate(value)})`)
      .attr('fill', d3.color(fill(value)).darker(1));

    section
      .select('svg path.arrow')
      .attr('transform', `rotate(${rotate(value)})`);

    section.select('svg path.gauge').attr('stroke-dashoffset', function() {
      return (
        d3
          .select(this)
          .node()
          .getTotalLength() * strokeDashoffset(value)
      );
    });
  }

  metrics.forEach(metric => {
    const domain = d3.extent(dataset, d => parseInt(d[metric.key]));
    console.log(dataset);
    Object.keys(metric.scales).forEach(scale =>
      metric.scales[scale].domain(domain)
    );

    const section = root.append('section').attr('id', `section-${metric.key}`);

    section
      .append('svg')
      .attr('class', 'icon')
      .attr('width', '1em')
      .attr('height', '1em')
      .attr('aria-focusable', 'false')
      .attr('aria-hidden', 'true')
      .attr('viewBox', '0 0 100 100')
      .append('path')
      .attr('fill', 'currentColor')
      .attr('d', iconsPaths[metric.key]);

    section.append('h2').text(metric.label);

    section.append('p');

    section.append('p');

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

    const wrapper = section
      .append('svg')
      .attr('class', 'gauge')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .attr('viewBox', `0 0 ${dimensions.width} ${dimensions.height}`);

    const gradientId = `linear-gradient-${metric.key}`;

    wrapper
      .append('defs')
      .append('linearGradient')
      .attr('id', gradientId)
      .selectAll('stop')
      .data(metric.scales.fill.range())
      .enter()
      .append('stop')
      .attr('offset', (d, i, { length }) => `${(i * 100) / (length - 1)}%`)
      .attr('stop-color', d => d);

    const bounds = wrapper
      .append('g')
      .style(
        'transform',
        `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
      );

    bounds
      .append('text')
      .text('Historical Average')
      .attr('text-anchor', 'middle')
      .attr('fill', 'currentColor')
      .attr('x', dimensions.boundedWidth / 2)
      .attr('y', -dimensions.margin.top + 16);

    bounds
      .append('text')
      .attr('class', 'average')
      .attr('text-anchor', 'middle')
      .attr('fill', 'currentColor')
      .attr('x', dimensions.boundedWidth / 2)
      .attr('y', -dimensions.margin.top + 38);

    bounds
      .append('text')
      .attr('class', 'value')
      .attr('text-anchor', 'middle')
      .attr('fill', 'hsl(210, 29%, 29%)')
      .attr('x', dimensions.boundedWidth / 2)
      .attr('y', dimensions.boundedHeight + dimensions.margin.bottom - 5)
      .style('font-size', 32)
      .style('letter-spacing', '1px')
      .style('font-weight', '900');

    const strokeWidthCircle = 1;
    const radiusCircle = dimensions.margin.left - strokeWidthCircle / 2;
    const paddingGauge = 2;
    const strokeWidthGauge = (radiusCircle - paddingGauge) * 2;

    const groupGauge = bounds
      .append('g')
      .attr(
        'transform',
        `translate(${dimensions.boundedWidth / 2} ${dimensions.boundedHeight})`
      );

    groupGauge
      .append('path')
      .attr('class', 'arrow')
      .attr('d', 'M 0 -8 a 8 8 0 0 1 0 16 q -6 0 -16 -8 10 -8 16 -8z')
      .attr('fill', 'currentColor')
      .attr('stroke', 'currentColor')
      .attr('stroke-width', 4)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round');

    groupGauge
      .append('path')
      .attr(
        'd',
        `M -${dimensions.boundedWidth / 2} 0 a ${dimensions.boundedWidth /
          2} ${dimensions.boundedWidth / 2} 0 0 1 ${dimensions.boundedWidth} 0`
      )
      .attr('stroke', 'currentColor')
      .attr('stroke-width', strokeWidthGauge)
      .attr('fill', 'none')
      .attr('opacity', 0.2)
      .attr('stroke-linecap', 'round');

    groupGauge
      .append('path')
      .attr('class', 'gauge')
      .attr(
        'd',
        `M -${dimensions.boundedWidth / 2} 0 a ${dimensions.boundedWidth /
          2} ${dimensions.boundedWidth / 2} 0 0 1 ${dimensions.boundedWidth} 0`
      )
      .attr('stroke', `url(#${gradientId})`)
      .attr('stroke-width', strokeWidthGauge)
      .attr('fill', 'none')
      .attr('opacity', 2)
      .attr('stroke-linecap', 'round')
      .attr('stroke-dasharray', function() {
        return d3
          .select(this)
          .node()
          .getTotalLength();
      })
      .attr('stroke-dashoffset', function() {
        return d3
          .select(this)
          .node()
          .getTotalLength();
      });

    groupGauge
      .append('path')
      .attr(
        'd',
        `M 0 ${-dimensions.boundedWidth / 2 - strokeWidthGauge / 2} v ${-10}`
      )
      .attr('stroke', 'currentColor')
      .attr('stroke-width', 1)
      .attr('fill', 'none');

    groupGauge
      .append('circle')
      .attr('class', 'bubble')
      .attr('r', radiusCircle)
      .attr('cx', -dimensions.boundedWidth / 2)
      .attr('fill', d3.color(metric.scales.fill.range()[0]).darker(1))
      .attr('stroke-width', strokeWidthCircle)
      .attr('stroke', d3.color(metric.scales.fill.range()[1]).darker(1.5));

    drawMetric(dataset.length - 1, metric);
  });
}

drawDashboard();
