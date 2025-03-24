const {
  json,
  range,
  bisect,
  scaleLinear,
  extent,
  interpolateHcl,
  line,
  curveMonotoneX,
  select,
  selectAll,
  merge,
  timer,
} = d3;

async function drawAnimatedSankey() {
  /* ACCESS DATA */
  const dataset = await json("./education.json");

  const sexAccessor = (d) => d.sex;
  const sexNames = ["female", "male"];
  const sexIds = range(sexNames.length);

  const educationAccessor = (d) => d.education;
  const educationNames = [
    "<High School",
    "High School",
    "Some Post-secondary",
    "Post-secondary",
    "Associate's",
    "Bachelor's and up",
  ];
  const educationIds = range(educationNames.length);

  const sesAccessor = (d) => d.ses;
  const sesNames = ["low", "middle", "high"];
  const sesIds = range(sesNames.length);

  const getStatusKey = ({ sex, ses }) => `${sex}--${ses}`;

  const stackedProbabilities = dataset.reduce((accDataset, currDataset) => {
    const { sex, ses } = currDataset;
    const key = getStatusKey({ sex, ses });
    const probabilities = educationNames.reduce(
      (accEducation, currEducation, i) => [
        ...accEducation,
        i < educationNames.length - 1
          ? accEducation[accEducation.length - 1] +
            currDataset[currEducation] / 100
          : 1,
      ],
      [0]
    );
    accDataset[key] = probabilities.slice(1);
    return accDataset;
  }, {});

  const getRandomValue = (array) =>
    array[Math.floor(Math.random() * array.length)];
  const getRandomNumberInRange = (min, max) =>
    Math.random() * (max - min) + min;

  let currentPersonId = 0;
  function generatePerson(elapsed) {
    currentPersonId += 1;
    const sex = getRandomValue(sexIds);
    const ses = getRandomValue(sesIds);

    const key = getStatusKey({ sex: sexNames[sex], ses: sesNames[ses] });
    const probabilities = stackedProbabilities[key];
    const probability = Math.random();
    const education = bisect(probabilities, probability);

    return {
      sex,
      ses,
      education,
      startTime: elapsed,
      yJitter: getRandomNumberInRange(-15, 15),
      id: currentPersonId,
    };
  }

  /* CHART DIMENSIONS */
  const dimensions = {
    width: 1000,
    height: 520,
    margin: {
      top: 10,
      right: 200,
      bottom: 10,
      left: 120,
    },
    pathHeight: 50,
    barWidth: 14,
    barPadding: 2,
  };

  dimensions.boundedWidth =
    dimensions.width - (dimensions.margin.left + dimensions.margin.right);
  dimensions.boundedHeight =
    dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

  /* SCALES */
  const colorScale = scaleLinear()
    .domain(extent(sesIds))
    .range(["hsl(178, 84%, 43%)", "hsl(332, 55%, 46%)"])
    .interpolate(interpolateHcl);

  const xScale = scaleLinear()
    .domain([0, 1])
    .range([0, dimensions.boundedWidth])
    .clamp(true);

  const startYScale = scaleLinear()
    .domain([sesIds.length, -1])
    .range([0, dimensions.boundedHeight]);

  const endYScale = scaleLinear()
    .domain([educationIds.length, -1])
    .range([0, dimensions.boundedHeight]);

  const linkPoints = 6;
  const linkGenerator = line()
    .x((d, i) => (i * dimensions.boundedWidth) / (linkPoints - 1))
    .y((d, i) => (i < linkPoints / 2 ? startYScale(d[0]) : endYScale(d[1])))
    .curve(curveMonotoneX);

  const linkOptions = merge(
    sesIds.map((startId) =>
      educationIds.map((endId) => Array(linkPoints).fill([startId, endId]))
    )
  );

  /* DRAW DATA */
  const root = select("#root");

  const header = root.append("header");

  header
    .append("h1")
    .text("What do people achieve within 12 years of starting high school?");
  header
    .append("p")
    .text(
      "Simulated data based on a National Center for Education Statistics study of where high school sophomores are ten years later."
    );

  const wrapper = root.append("main").attr("id", "wrapper");

  const svg = wrapper.append("svg");

  root
    .append("footer")
    .html(
      `Data from the U.S. Department of Education, National Center for Education Statistics. <a href="https://nces.ed.gov/programs/digest/d14/tables/dt14_104.91.asp">Education Longitudinal Study of 2002</a>.`
    );

  svg
    .attr("width", dimensions.width)
    .attr("height", dimensions.height)
    .attr("viewBox", [0, 0, dimensions.width, dimensions.height]);

  const bounds = svg
    .append("g")
    .attr(
      "transform",
      `translate(${dimensions.margin.left} ${dimensions.margin.top})`
    );

  const linksGroup = bounds.append("g");
  const peripheralsGroup = bounds.append("g");
  const markersGroup = bounds.append("g");
  const metricsGroup = bounds.append("g");
  const startingBarsGroup = bounds.append("g");

  linksGroup
    .selectAll("path")
    .data(linkOptions)
    .enter()
    .append("path")
    .attr("d", linkGenerator)
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", dimensions.pathHeight);

  /* PERIPHERALS */
  const startLabelGroup = peripheralsGroup
    .append("g")
    .attr("transform", "translate(-16, 0)")
    .attr("text-anchor", "end")
    .attr("fill", "currentColor");

  const startLabel = startLabelGroup
    .append("text")
    .attr("font-size", 12)
    .attr("fill", " hsl(215, 10%, 56%)")
    .attr("y", startYScale(sesIds[sesIds.length - 1]) - 64);

  startLabel.append("tspan").text("Socioeconomic");
  startLabel.append("tspan").attr("x", 0).attr("dy", 16).text("Status");

  startLabelGroup
    .append("g")
    .attr("dominant-baseline", "middle")
    .attr("font-size", 15)
    .attr("font-weight", 700)
    .selectAll("text")
    .data(sesIds)
    .enter()
    .append("text")
    .text((d) => sesNames[d])
    .attr("y", (d) => startYScale(d))
    .style("text-transform", "capitalize");

  const endLabelGroup = peripheralsGroup
    .append("g")
    .attr("transform", `translate(${dimensions.boundedWidth + 32}, 0)`)
    .attr("text-anchor", "start")
    .attr("fill", "currentColor");

  const endLabelGroups = endLabelGroup
    .selectAll("g")
    .data(educationIds)
    .enter()
    .append("g")
    .attr(
      "transform",
      (d) => `translate(0 ${endYScale(d) - dimensions.pathHeight / 2 + 12})`
    );

  endLabelGroups
    .append("text")
    .attr("font-size", 15)
    .attr("font-weight", 700)
    .text((d) => educationNames[d])
    .style("text-transform", "capitalize");

  const radiusCircle = 5;

  endLabelGroups
    .append("circle")
    .attr("opacity", 0.5)
    .attr("fill", "hsl(215, 10%, 56%)")
    .attr("r", radiusCircle)
    .attr("transform", "translate(5 14)");

  const pointsTriangle = [
    [-6, 5],
    [6, 5],
    [0, -5],
  ].join(",");

  endLabelGroups
    .append("polygon")
    .attr("opacity", 0.5)
    .attr("fill", "hsl(215, 10%, 56%)")
    .attr("points", pointsTriangle)
    .attr("transform", "translate(5 30)");

  startingBarsGroup
    .selectAll("rect")
    .data(sesIds)
    .enter()
    .append("rect")
    .attr("fill", (d) => colorScale(d))
    .attr("x", -dimensions.barWidth / 2)
    .attr("width", dimensions.barWidth)
    .attr("y", (d) => startYScale(d) - dimensions.pathHeight / 2)
    .attr("height", dimensions.pathHeight);

  const legendGroup = bounds
    .append("g")
    .attr("fill", " hsl(215, 10%, 56%)")
    .attr(
      "transform",
      `translate(${dimensions.boundedWidth - dimensions.barWidth} ${
        endYScale(educationIds[educationIds.length - 1]) -
        dimensions.pathHeight / 2
      })`
    );

  const femaleLegendGroup = legendGroup
    .append("g")
    .attr("transform", `translate(${dimensions.barWidth / 2} 0)`);
  femaleLegendGroup
    .append("path")
    .attr("d", "M 0 -5 v -15")
    .attr("fill", "none")
    .attr("stroke", "currentColor")
    .attr("stroke-width", 0.5);

  femaleLegendGroup
    .append("circle")
    .attr("opacity", 0.5)
    .attr("transform", `translate(0 -30)`)
    .attr("r", radiusCircle)
    .attr("fill", "hsl(215, 10%, 56%)");

  femaleLegendGroup
    .append("text")
    .attr("transform", `translate(-12 -30)`)
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "middle")
    .attr("font-size", 11)
    .text("Female");

  const maleLegendGroup = legendGroup
    .append("g")
    .attr(
      "transform",
      `translate(${
        dimensions.barWidth + dimensions.barPadding + dimensions.barWidth / 2
      } 0)`
    );
  maleLegendGroup
    .append("path")
    .attr("d", "M 0 -5 v -15")
    .attr("fill", "none")
    .attr("stroke", "currentColor")
    .attr("stroke-width", 0.5);

  maleLegendGroup
    .append("polygon")
    .attr("opacity", 0.5)
    .attr("transform", `translate(0 -30)`)
    .attr("points", pointsTriangle)
    .attr("fill", "hsl(215, 10%, 56%)");

  maleLegendGroup
    .append("text")
    .attr("transform", `translate(12 -30)`)
    .attr("text-anchor", "start")
    .attr("dominant-baseline", "middle")
    .attr("font-size", 11)
    .text("Male");

  /* METRICS */
  const dataMetrics = educationIds.map(() =>
    sexIds.map(() => sesIds.map(() => 0))
  );

  metricsGroup.attr("transform", `translate(${dimensions.boundedWidth} 0)`);

  const heightScale = scaleLinear().range([0, dimensions.pathHeight]); // domain defaults to [0, 1]

  function highlightMetrics(metrics) {
    const data = merge(
      metrics.map((education, educationId) =>
        merge(
          education.map((sex, sexId) => {
            const total = sex.reduce((acc, curr) => acc + curr, 0);
            heightScale.domain([0, total]);

            return sex.reduce((acc, curr, sesId) => {
              const height = heightScale(curr);
              const y = acc[acc.length - 1]
                ? acc[acc.length - 1].y - height
                : dimensions.pathHeight - height;

              return [
                ...acc,
                {
                  sex: sexId,
                  education: educationId,
                  ses: sesId,
                  count: curr,
                  total,
                  height,
                  y,
                },
              ];
            }, []);
          })
        )
      )
    );

    metricsGroup
      .selectAll("rect")
      .data(data)
      .join("rect")
      .style("transition", "all 0.25s ease-out")
      .attr(
        "transform",
        (d) =>
          `translate(${
            -dimensions.barWidth +
            (dimensions.barWidth + dimensions.barPadding) * d.sex
          } ${endYScale(d.education) - dimensions.pathHeight / 2})`
      )
      .attr("width", dimensions.barWidth)
      .attr("fill", (d) => (d.total ? colorScale(d.ses) : "hsl(240, 4%, 86%)"))
      .attr("y", (d) => (d.total ? d.y : 0))
      .attr("height", (d) => (d.total ? d.height : dimensions.pathHeight));

    metricsGroup
      .selectAll("text")
      .data(data)
      .join("text")
      .text((d) => d.count)
      .attr(
        "transform",
        (d) =>
          `translate(${32 + 28 + d.ses * 32} ${
            12 +
            15 +
            endYScale(d.education) -
            dimensions.pathHeight / 2 +
            16 * d.sex
          })`
      )
      .attr("fill", (d) => colorScale(d.ses))
      .attr("font-size", 13)
      .attr("font-weight", 600)
      .attr("dominant-baseline", "middle");
  }

  /* PEOPLE */
  let people = [];

  let t;
  const yProgressScale = scaleLinear()
    .domain([0.45, 0.55])
    .range([0, 1])
    .clamp(true);

  const time = 5000;
  const generations = 5;
  const xProgressAccessor = (elapsed, d) => (elapsed - d.startTime) / time;

  function updateMarkers(elapsed) {
    people = [
      ...people.filter((d) => xProgressAccessor(elapsed, d) < 1),
      generatePerson(elapsed),
    ];

    const updateFemales = markersGroup.selectAll(".marker-circle").data(
      people.filter((d) => sexAccessor(d) === 0),
      (d) => d.id
    );

    updateFemales
      .enter()
      .append("circle")
      .attr("class", "marker marker-circle")
      .attr("fill", (d) => colorScale(sesAccessor(d)))
      .attr("r", radiusCircle)
      .style("mix-blend-mode", "multiply")
      .style("opacity", 0)
      .transition()
      .duration(200)
      .style("opacity", 1);

    const updateMale = markersGroup.selectAll(".marker-triangle").data(
      people.filter((d) => sexAccessor(d) === 1),
      (d) => d.id
    );

    updateMale
      .enter()
      .append("polygon")
      .attr("class", "marker marker-triangle")
      .attr("fill", (d) => colorScale(sesAccessor(d)))
      .attr("points", pointsTriangle)
      .style("mix-blend-mode", "multiply")
      .style("opacity", 0)
      .transition()
      .duration(200)
      .style("opacity", 1);

    updateFemales
      .exit()
      .merge(updateMale.exit())
      .each(({ sex, ses, education }) => {
        dataMetrics[education][sex][ses] += 1;
        highlightMetrics(dataMetrics);
      })
      .remove();

    selectAll(".marker").attr("transform", (d) => {
      const xProgress = xProgressAccessor(elapsed, d);
      const x = xScale(xProgress);
      const yStart = startYScale(sesAccessor(d));
      const yEnd = endYScale(educationAccessor(d));
      const yGap = yEnd - yStart;
      const yProgress = yProgressScale(xProgress);
      const y = yStart + yGap * yProgress + d.yJitter;

      return `translate(${x} ${y})`;
    });

    if (elapsed > time * generations) {
      t.stop();
    }
  }

  highlightMetrics(dataMetrics);
  t = timer(updateMarkers);
}

drawAnimatedSankey();
