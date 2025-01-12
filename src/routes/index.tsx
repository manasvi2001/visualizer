import type { NoSerialize } from "@builder.io/qwik";
import {
  $,
  component$,
  noSerialize,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import FrequencyChart from "~/components/FrequencyChart";

export default component$(() => {
  const userInteracted = useSignal(false);
  const audioStream = useSignal<NoSerialize<MediaStream>>();
  const error = useSignal("");

  const audioContext = useSignal<NoSerialize<AudioContext>>();
  const analyserRef = useSignal<NoSerialize<AnalyserNode>>();
  const dataArrayRef = useSignal<Uint8Array<ArrayBuffer>>(new Uint8Array());

  // Request user microphone
  const getAudioPermission = $(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStream.value = noSerialize(stream);
    } catch (err) {
      console.error(err);
      error.value = "Microphone permission denied or error occurred.";
    }
  });

  // Mount & cleanup
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(
    ({ cleanup }) => {
      getAudioPermission();
      cleanup(() => {
        if (audioContext.value) {
          audioContext.value.close();
        }
      });
    },
    { strategy: "document-ready" }
  );

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    const interacted = track(userInteracted);
    if (!interacted) {
      return;
    }
    const newAudioStream = track(audioStream);
    audioContext.value = noSerialize(new window.AudioContext());
    const source = audioContext.value?.createMediaStreamSource(
      newAudioStream as MediaStream
    );
    if (!source) {
      return;
    }

    analyserRef.value = noSerialize(audioContext.value?.createAnalyser());
    if (!analyserRef.value) {
      return;
    }
    analyserRef.value.fftSize = 1024;
    source.connect(analyserRef.value);

    const bufferLength = analyserRef.value.frequencyBinCount;
    dataArrayRef.value = new Uint8Array(bufferLength);
  });

  return (
    <>
      <h1>Qwik Audio Analyzer</h1>
      {error.value && <p style={{ color: "red" }}>{error}</p>}
      {!error.value && !audioStream.value && (
        <p>Requesting microphone access...</p>
      )}
      <button
        onClick$={() => {
          userInteracted.value = true;
        }}
      >
        Start Recording
      </button>
      <button
        onClick$={() => {
          userInteracted.value = false;
          if (audioContext.value) {
            audioContext.value.close();
            dataArrayRef.value = new Uint8Array();
          }
        }}
      >
        Stop Recording
      </button>
      {audioStream.value && (
        <FrequencyChart analyserRef={analyserRef} dataArrayRef={dataArrayRef} />
      )}
      {/* {audioStream.value && <div>Audio Permission Granted</div>} */}
    </>
  );
});

export const head: DocumentHead = {
  title: "Welcome to Qwik",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};
