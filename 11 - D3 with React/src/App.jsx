import "./App.css";
import { getScatterData, getTimelineData } from "./data";
import Timeline from "./Timeline";
import ScatterPlot from "./ScatterPlot";
import Histogram from "./Histogram";
import { timeParse } from "d3";

function App() {
  const parseDate = timeParse("%m/%d/%Y");

  return (
    <div className="app">
      <header>
        <h1>Weather dahboard</h1>
      </header>

      <div className="charts">
        <figure className="chart timeline">
          <Timeline
            data={getTimelineData()}
            xAccessor={(d) => parseDate(d.date)}
            yAccessor={(d) => d.temperature}
            label="Temperature"
          />
        </figure>

        <figure className="chart scatterplot">
          <ScatterPlot
            data={getScatterData()}
            xAccessor={(d) => d.humidity}
            yAccessor={(d) => d.temperature}
            xLabel="Humidity"
            yLabel="Temperature"
          />
        </figure>

        <figure className="chart histogram">
          <Histogram
            data={getScatterData()}
            accessor={(d) => d.humidity}
            label="Humidity"
          />
        </figure>
      </div>
    </div>
  );
}

export default App;
