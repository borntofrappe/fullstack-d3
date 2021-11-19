async function drawColorScales() {
  function drawColorScale(scale) {
    const article = d3.select("#wrapper").append("article");
    article.append("h2").text(scale.type);

    const dimensions = {
      width: 300,
      height: 20,
    };

    const section = article.append("section");

    if (scale.type === "categorical") {
      scale.schemes.forEach((scheme) => {
        section.append("p").text(scheme);
        const svg = section
          .append("svg")
          .attr("width", dimensions.width)
          .attr("height", dimensions.height);

        svg
          .selectAll("rect")
          .data(d3[scheme])
          .enter()
          .append("rect")
          .attr("x", (_, i, { length }) => (i * dimensions.width) / length)
          .attr("width", (_, i, { length }) => dimensions.width / length)
          .attr("height", dimensions.height)
          .attr("fill", (d) => d);
      });
    } else {
      scale.functions.forEach(({ name, callback }) => {
        section.append("p").text(name);
        const svg = section
          .append("svg")
          .attr("width", dimensions.width)
          .attr("height", dimensions.height);

        const stops = 10;
        const id = `gradient-id-${name.replace(/[^a-z]/gi, "")}`;
        svg
          .append("defs")
          .append("linearGradient")
          .attr("id", id)
          .selectAll("stop")
          .data(
            Array(stops)
              .fill()
              .map((_, i, { length }) => i / length)
          )
          .enter()
          .append("stop")
          .attr("stop-color", (d) => callback(d))
          .attr("offset", (_, i, { length }) => `${(i * 100) / (length - 1)}%`);

        svg
          .append("rect")
          .attr("width", dimensions.width)
          .attr("height", dimensions.height)
          .attr("fill", `url(#${id})`);
      });
    }
  }

  const scales = [
    {
      type: "categorical",
      schemes: [
        "schemeCategory10",
        "schemeAccent",
        "schemeDark2",
        "schemePaired",
        "schemePastel1",
        "schemePastel2",
        "schemeSet1",
        "schemeSet2",
        "schemeSet3",
        "schemeTableau10",
      ],
    },
    {
      type: "sequential single hue",
      functions: [
        {
          name: "interpolateBlues",
          callback: (d) => d3.interpolateBlues(d),
        },
        {
          name: "interpolateGreens",
          callback: (d) => d3.interpolateGreens(d),
        },
        {
          name: "interpolateGreys",
          callback: (d) => d3.interpolateGreys(d),
        },
        {
          name: "interpolateOranges",
          callback: (d) => d3.interpolateOranges(d),
        },
        {
          name: "interpolatePurples",
          callback: (d) => d3.interpolatePurples(d),
        },
        {
          name: "interpolateReds",
          callback: (d) => d3.interpolateReds(d),
        },
      ],
    },
    {
      type: "sequential multi hue",
      functions: [
        {
          name: "interpolateTurbo",
          callback: (d) => d3.interpolateTurbo(d),
        },
        {
          name: "interpolateViridis",
          callback: (d) => d3.interpolateViridis(d),
        },
        {
          name: "interpolateInferno",
          callback: (d) => d3.interpolateInferno(d),
        },
        {
          name: "interpolateMagma",
          callback: (d) => d3.interpolateMagma(d),
        },
        {
          name: "interpolatePlasma",
          callback: (d) => d3.interpolatePlasma(d),
        },
        {
          name: "interpolateCividis",
          callback: (d) => d3.interpolateCividis(d),
        },
        {
          name: "interpolateWarm",
          callback: (d) => d3.interpolateWarm(d),
        },
        {
          name: "interpolateCool",
          callback: (d) => d3.interpolateCool(d),
        },
        {
          name: "interpolateCubehelixDefault",
          callback: (d) => d3.interpolateCubehelixDefault(d),
        },
        {
          name: "interpolateBuGn",
          callback: (d) => d3.interpolateBuGn(d),
        },
        {
          name: "interpolateBuPu",
          callback: (d) => d3.interpolateBuPu(d),
        },
        {
          name: "interpolateGnBu",
          callback: (d) => d3.interpolateGnBu(d),
        },
        {
          name: "interpolateOrRd",
          callback: (d) => d3.interpolateOrRd(d),
        },
        {
          name: "interpolatePuBuGn",
          callback: (d) => d3.interpolatePuBuGn(d),
        },
        {
          name: "interpolatePuBu",
          callback: (d) => d3.interpolatePuBu(d),
        },
        {
          name: "interpolatePuRd",
          callback: (d) => d3.interpolatePuRd(d),
        },
        {
          name: "interpolateRdPu",
          callback: (d) => d3.interpolateRdPu(d),
        },
        {
          name: "interpolateYlGnBu",
          callback: (d) => d3.interpolateYlGnBu(d),
        },
        {
          name: "interpolateYlGn",
          callback: (d) => d3.interpolateYlGn(d),
        },
        {
          name: "interpolateYlOrBr",
          callback: (d) => d3.interpolateYlOrBr(d),
        },
        {
          name: "interpolateYlOrRd",
          callback: (d) => d3.interpolateYlOrRd(d),
        },
      ],
    },
    {
      type: "diverging",
      functions: [
        {
          name: "interpolateBrBG",
          callback: (d) => d3.interpolateBrBG(d),
        },
        {
          name: "interpolatePRGn",
          callback: (d) => d3.interpolatePRGn(d),
        },
        {
          name: "interpolatePiYG",
          callback: (d) => d3.interpolatePiYG(d),
        },
        {
          name: "interpolatePuOr",
          callback: (d) => d3.interpolatePuOr(d),
        },
        {
          name: "interpolateRdBu",
          callback: (d) => d3.interpolateRdBu(d),
        },
        {
          name: "interpolateRdGy",
          callback: (d) => d3.interpolateRdGy(d),
        },
        {
          name: "interpolateRdYlBu",
          callback: (d) => d3.interpolateRdYlBu(d),
        },
        {
          name: "interpolateRdYlGn",
          callback: (d) => d3.interpolateRdYlGn(d),
        },
        {
          name: "interpolateSpectral",
          callback: (d) => d3.interpolateSpectral(d),
        },
      ],
    },
    {
      type: "cyclical",
      functions: [
        {
          name: "interpolateRainbow",
          callback: (d) => d3.interpolateRainbow(d),
        },
        {
          name: "interpolateSinebow",
          callback: (d) => d3.interpolateSinebow(d),
        },
      ],
    },
    {
      type: "custom",
      functions: [
        {
          name: 'interpolateRgb("cyan", "tomato")',
          callback: (color) => d3.interpolateRgb("cyan", "tomato")(color),
        },
        {
          name: 'interpolateHsl("cyan", "tomato")',
          callback: (color) => d3.interpolateHsl("cyan", "tomato")(color),
        },
        {
          name: 'interpolateHcl("cyan", "tomato")',
          callback: (color) => d3.interpolateHcl("cyan", "tomato")(color),
        },
      ],
    },
  ];

  scales.forEach((scale) => drawColorScale(scale));
}

drawColorScales();
