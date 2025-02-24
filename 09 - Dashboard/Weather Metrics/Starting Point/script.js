const { json, select } = d3;

async function drawDashboard() {
  const dataset = await json("../../../nyc_weather_data.json");

  let selectedDay = 0;
  const metrics = ["windSpeed", "visibility", "pressure"];

  const wrapper = select("#wrapper");
  const articles = wrapper
    .selectAll("article")
    .data(metrics)
    .enter()
    .append("article")
    .attr("id", (d) => `article-${d}`);

  articles.append("h2").text((d) => d);

  articles.append("p").text((d) => dataset[selectedDay][d]);

  wrapper
    .append("button")
    .text("Change Date")
    .on("click", () => {
      selectedDay = (selectedDay + 1) % dataset.length;
      articles.select("p").text((d) => dataset[selectedDay][d]);
    });
}

drawDashboard();
