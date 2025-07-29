import React, { useEffect, useState, useRef } from "react";

function App() {
  const [previewImage, setPreviewImage] = useState(null);
  const [averageColor, setAverageColor] = useState(null);
  const [midiValues, setMidiValues] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Request access to the Web MIDI API

    const onMIDISuccess = (midiAccess) => {
      for (let input of midiAccess.inputs.values()) {
        input.onmidimessage = handleMIDIMessage;
      }
    };

    const onMIDIFailure = () => {
      console.error("Failed to access MIDI devices.");
    };

    const handleMIDIMessage = (event) => {
      const [status, data1, data2] = event.data;

      const command = status >> 4;
      const channel = status & 0xf;
      const note = data1;
      const velocity = data2;

      switch (command) {
        case 8: // note off
          console.log(`Note Off: ${note} (Channel ${channel + 1})`);
          break;
        case 9: // note on
          if (velocity === 0) {
            console.log(`Note Off: ${note} (Channel ${channel + 1})`);
          } else {
            console.log(
              `Note On: ${note} (Velocity: ${velocity}, Channel ${channel + 1})`
            );
          }
          break;
        case 11: // control change
          console.log(`Control Change: Controller ${note}, Value ${velocity}`);
          break;
        default:
          console.log(`MIDI Message: ${event.data}`);
      }
    };

    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
    } else {
      console.error("MIDI is not supported on this browser :(");
    }
  }, []);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
        calculateAverageColor(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateAverageColor = (imageSrc) => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let totalR = 0,
        totalG = 0,
        totalB = 0,
        totalA = 0;
      let pixelCount = 0;

      for (let i = 0; i < data.length; i += 4) {
        totalR += data[i];
        totalG += data[i + 1];
        totalB += data[i + 2];
        totalA += data[i + 3];
        pixelCount++;
      }

      const avgR = Math.round(totalR / pixelCount);
      const avgG = Math.round(totalG / pixelCount);
      const avgB = Math.round(totalB / pixelCount);
      const avgA = Math.round(totalA / pixelCount);

      const color = { r: avgR, g: avgG, b: avgB, a: avgA };
      setAverageColor(color);

      const midi = {
        r: rgbToMidi(avgR),
        g: rgbToMidi(avgG),
        b: rgbToMidi(avgB),
        a: rgbToMidi(avgA),
      };
      setMidiValues(midi);
    };
    img.src = imageSrc;
  };

  const rgbToMidi = (rgb) => Math.round(rgb * (127 / 255));

  const handleMidiUpload = async () => {
    try {
      const midiAccess = await navigator.requestMIDIAccess();
      const outputs = Array.from(midiAccess.outputs.values());

      if (outputs.length === 0) {
        alert("No MIDI outputs found. Please connect a MIDI device.");
        return;
      }

      // const output = outputs[0];

      // const placeholderData = [
      //   [0x90, 60, 100],
      //   [0x90, 64, 100],
      //   [0x90, 67, 100],
      //   [0x80, 60, 0],
      //   [0x80, 64, 0],
      //   [0x80, 67, 0],
      // ];

      // placeholderData.forEach((message, index) => {
      //   setTimeout(() => {
      //     output.send(message);
      //   }, index * 200);
      // });

      alert(averageColor);
    } catch (error) {
      console.error("MIDI Error:", error);
      alert("MIDI not supported or access denied");
    }
  };

  return (
    <div className="container">
      <h1>Load MIDI Preset from Image</h1>
      <p>Upload your preset image, or upload something else for a surprise!</p>

      <div className="upload-section">
        <input
          type="file"
          id="imageInput"
          accept="image/*"
          onChange={handleImageUpload}
        />
        <label htmlFor="imageInput" className="upload-button">
          Choose Image
        </label>
      </div>

      {previewImage && (
        <div className="image-preview">
          <img src={previewImage} alt="Uploaded image" />
        </div>
      )}

      {averageColor && midiValues && (
        <div className="result">
          <div className="color-display">
            <div
              className="color-swatch"
              style={{
                backgroundColor: `rgba(${averageColor.r}, ${averageColor.g}, ${averageColor.b}, ${averageColor.a})`,
              }}
            ></div>
            <div className="color-info">
              <p>
                MIDI Values:
                {midiValues.r},{midiValues.g},{midiValues.b},{midiValues.a}
              </p>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

      <div className="upload-section">
        <button className="upload-button" onClick={handleMidiUpload}>
          Upload
        </button>
      </div>
    </div>
  );
}

export default App;
