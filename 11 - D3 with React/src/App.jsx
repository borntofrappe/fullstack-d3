import "./App.css";
import { getScatterData } from "./data";
import ScatterPlot from "./ScatterPlot";

function App() {
  return (
    <>
      <header>
        <h1>Weather dahboard</h1>
      </header>

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
