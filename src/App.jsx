import React, { useEffect, useState, useRef } from "react";

const App = () => {
  const canvasRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [RGB, setRGB] = useState({
    r: 26,
    g: 161,
    b: 127,
  });

  const rgbToMidi = (rgb) => Math.round(rgb * (127 / 255));
  const midiToRgb = (midi) => Math.round(midi * (255 / 127));

  const updateColorsViaMidi = (note, velocity) => {
    switch (note) {
      case 1:
        setRGB((prevRGB) => ({ ...prevRGB, r: midiToRgb(velocity) }));
        break;
      case 33:
        setRGB((prevRGB) => ({ ...prevRGB, g: midiToRgb(velocity) }));
        break;
      case 21:
        setRGB((prevRGB) => ({ ...prevRGB, b: midiToRgb(velocity) }));
        break;
    }
  };

  const handleMIDIMessage = (event) => {
    const [status, data1, data2] = event.data;

    const command = status >> 4;
    const note = data1;
    const velocity = data2;

    switch (command) {
      case 11:
        updateColorsViaMidi(note, velocity);
        break;
      default:
        console.log(`MIDI Message: ${event.data}`);
    }
  };

  useEffect(() => {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(
        (midiAccess) => {
          for (let input of midiAccess.inputs.values()) {
            input.onmidimessage = handleMIDIMessage;
          }
        },
        () => console.error("Failed to access MIDI devices.")
      );
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
        calculateRGB(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateRGB = (imageSrc) => {
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
        totalB = 0;
      let pixelCount = 0;

      for (let i = 0; i < data.length; i += 4) {
        totalR += data[i];
        totalG += data[i + 1];
        totalB += data[i + 2];
        pixelCount++;
      }

      const avgR = Math.round(totalR / pixelCount);
      const avgG = Math.round(totalG / pixelCount);
      const avgB = Math.round(totalB / pixelCount);
      setRGB({ r: avgR, g: avgG, b: avgB });
    };
    img.src = imageSrc;
  };

  const handleMidiUpload = async () => {
    try {
      const midiAccess = await navigator.requestMIDIAccess();
      const outputs = Array.from(midiAccess.outputs.values());

      if (outputs.length === 0) {
        alert("No MIDI outputs found. Please connect a MIDI device.");
        return;
      }

      const output = outputs[0];

      const midiData = [
        [0xb0 + 4, 1, rgbToMidi(RGB.r)],
        [0xb0 + 4, 33, rgbToMidi(RGB.g)],
        [0xb0 + 4, 21, rgbToMidi(RGB.b)],
      ];

      midiData.forEach((message, index) => {
        output.send(message);
      });
    } catch (error) {
      console.error("MIDI Error:", error);
      alert("MIDI not supported or access denied");
    }
  };

  const handleSnapshot = () => {
    const colorSwatchElement = document.querySelector(".color-swatch");
    if (!colorSwatchElement) {
      alert("Color swatch not found");
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const rect = colorSwatchElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.fillStyle = `rgb(${RGB.r}, ${RGB.g}, ${RGB.b})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `meris-preset-mix${RGB.r}-decay${RGB.g}-mod${RGB.b}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  return (
    <div className="container">
      <h1>MIDI // Colours</h1>
      <p>
        Convert colours to MIDI and vice-versa. Create, save, and upload
        presets.
      </p>

      <div className="upload-section">
        <input
          type="file"
          id="imageInput"
          accept="image/*"
          onChange={handleImageUpload}
          value=""
        />
        <label htmlFor="imageInput" className="upload-button">
          Upload
        </label>
      </div>

      {previewImage ? (
        <div className="image-preview">
          <img src={previewImage} alt="Uploaded image" />
          <button
            className="delete-image"
            onClick={() => setPreviewImage(null)}
          >
            Delete Image
          </button>
        </div>
      ) : (
        <div
          className="color-preview"
          style={{
            backgroundColor: `rgba(${RGB.r}, ${RGB.g}, ${RGB.b})`,
          }}
        ></div>
      )}

      {RGB && (
        <div className="result">
          <div className="color-display">
            <div
              className="color-swatch"
              style={{
                backgroundColor: `rgba(${RGB.r}, ${RGB.g}, ${RGB.b})`,
              }}
            ></div>
            <div className="color-info">
              <p>
                MIDI Values: {rgbToMidi(RGB.r)}, {rgbToMidi(RGB.g)},{" "}
                {rgbToMidi(RGB.b)}
              </p>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

      <div className="upload-section">
        <button className="upload-button" onClick={handleSnapshot}>
          Save Preset
        </button>
        <button className="upload-button" onClick={handleMidiUpload}>
          Send to Device
        </button>
      </div>
    </div>
  );
};

export default App;
