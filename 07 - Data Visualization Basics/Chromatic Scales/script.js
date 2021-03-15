async function drawColorScales() {
  function drawColorScale(scale) {
    const article = d3.select('#wrapper').append('article');
    article.append('h2').text(scale.type);

    const dimensions = {
      width: 200,
      height: 20,
    };

    scale.functions.forEach(f => {
      const section = article.append('section');
      section.append('p').text(f);

      const svg = section
        .append('svg')
        .attr('width', dimensions.width)
        .attr('height', dimensions.height);

      const colors = d3[f];

      if (scale.type === 'categorical') {
        svg
          .selectAll('rect')
          .data(colors)
          .enter()
          .append('rect')
          .attr('x', (d, i, { length }) => (i * dimensions.width) / length)
          .attr('width', (d, i, { length }) => dimensions.width / length)
          .attr('height', dimensions.height)
          .attr('fill', d => d);
      } else {
        const stops = 10;
        const id = `gradient-id-${f}`;
        svg
          .append('defs')
          .append('linearGradient')
          .attr('id', id)
          .selectAll('stop')
          .data(
            Array(stops)
              .fill()
              .map((d, i, { length }) => i / length)
          )
          .enter()
          .append('stop')
          .attr('stop-color', d => colors(d))
          .attr('offset', (d, i, { length }) => `${(i * 100) / (length - 1)}%`);

        svg
          .append('rect')
          .attr('width', dimensions.width)
          .attr('height', dimensions.height)
          .attr('fill', `url(#${id})`);
      }
    });
  }

  const scales = [
    {
      type: 'categorical',
      functions: ['schemeCategory10', 'schemeAccent', 'schemeDark2', 'schemePaired', 'schemePastel1', 'schemePastel2', 'schemeSet1', 'schemeSet2', 'schemeSet3', 'schemeTableau10'],
    },
    {
      type: 'sequential single hue',
      functions: ['interpolateBlues', 'interpolateGreens', 'interpolateGreys', 'interpolateOranges', 'interpolatePurples', 'interpolateReds'],
    },
    {
      type: 'sequential multi hue',
      functions: ['interpolateTurbo', 'interpolateViridis', 'interpolateInferno', 'interpolateMagma', 'interpolatePlasma', 'interpolateCividis', 'interpolateWarm', 'interpolateCool', 'interpolateCubehelixDefault', 'interpolateBuGn', 'interpolateBuPu', 'interpolateGnBu', 'interpolateOrRd', 'interpolatePuBuGn', 'interpolatePuBu', 'interpolatePuRd', 'interpolateRdPu', 'interpolateYlGnBu', 'interpolateYlGn', 'interpolateYlOrBr', 'interpolateYlOrRd'],
    },
    {
      type: 'diverging',
      functions: ['interpolateBrBG', 'interpolatePRGn', 'interpolatePiYG', 'interpolatePuOr', 'interpolateRdBu', 'interpolateRdGy', 'interpolateRdYlBu', 'interpolateRdYlGn', 'interpolateSpectral'],
    },
    {
      type: 'cyclical',
      functions: ['interpolateRainbow', 'interpolateSinebow'],
    },
  ];

  scales.forEach(scale => drawColorScale(scale));
}
drawColorScales();
