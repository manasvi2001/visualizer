import type { NoSerialize, Signal } from "@builder.io/qwik";
import { component$, isServer, useSignal, useTask$ } from "@builder.io/qwik";

interface FrequencyChartProps {
  analyserRef: Signal<NoSerialize<AnalyserNode>>;
  dataArrayRef: Signal<Uint8Array<ArrayBuffer>>;
}

export default component$<FrequencyChartProps>(
  ({ analyserRef, dataArrayRef }) => {
    const frequencyData = useSignal<Array<number>>([]);

    useTask$(({ track, cleanup }) => {
      if (isServer) {
        return;
      }
      const newAnalyserRef = track(analyserRef);
      const newDataRef = track(dataArrayRef);

      let animationId: number = 0;
      const renderFrame = () => {
        if (newAnalyserRef && newDataRef) {
          newAnalyserRef.getByteFrequencyData(newDataRef);
          frequencyData.value = [...newDataRef];
        }
        animationId = requestAnimationFrame(renderFrame);
      };
      renderFrame();

      cleanup(() => {
        if (animationId) cancelAnimationFrame(animationId);
      });
    });
    return (
      <div style={{ display: "flex" }}>
        {frequencyData.value.map((value, index) => (
          <div
            key={index}
            style={{
              width: 2,
              height: value,
              background: "blue",
              marginRight: 1,
            }}
          />
        ))}
      </div>
    );
  }
);
