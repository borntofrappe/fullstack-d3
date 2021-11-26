const { json, select } = d3;

async function drawDashboard() {
  const dataset = await json("../../../nyc_weather_data.json");

  const wrapper = select("#wrapper");

  function drawMetric(day, metric) {
    const article = select(`#article-${metric}`);

    article.select(`h2`).text(metric);
    article.select(`p`).text(dataset[day][metric]);
  }

  const metrics = ["windSpeed", "visibility", "pressure"];

  let selectedDay = 0;
  metrics.forEach((metric) => {
    const article = wrapper.append("article").attr("id", `article-${metric}`);

    article.append("h2");
    article.append("p");

    drawMetric(selectedDay, metric);
  });

  wrapper
    .append("button")
    .text("Change Date")
    .on("click", () => {
      selectedDay = (selectedDay + 1) % dataset.length;

      metrics.forEach((metric) => drawMetric(selectedDay, metric));
    });
}

drawDashboard();
