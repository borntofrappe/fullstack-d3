import "./App.css";
import { getScatterData, getTimelineData } from "./data";
import Timeline from "./Timeline";
import ScatterPlot from "./ScatterPlot";
import { timeParse } from "d3";

function App() {
  const parseDate = timeParse("%m/%d/%Y");

  return (
    <>
      <header>
        <h1>Weather dahboard</h1>
      </header>

      <figure class="chart timeline">
        <Timeline
          data={getTimelineData()}
          xAccessor={(d) => parseDate(d.date)}
          yAccessor={(d) => d.temperature}
          label="Temperature"
        />
      </figure>

      <figure class="chart scatterplot">
        <ScatterPlot
          data={getScatterData()}
          xAccessor={(d) => d.humidity}
          yAccessor={(d) => d.temperature}
          xLabel="Humidity"
          yLabel="Temperature"
        />
      </figure>
    </>
  );
}

export default App;
