import React, { useState, useRef } from 'react'

function App() {
  const [previewImage, setPreviewImage] = useState(null)
  const [averageColor, setAverageColor] = useState(null)
  const [midiValues, setMidiValues] = useState(null)
  const canvasRef = useRef(null)

  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target.result)
        calculateAverageColor(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const calculateAverageColor = (imageSrc) => {
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      canvas.width = img.width
      canvas.height = img.height
      
      ctx.drawImage(img, 0, 0)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      let totalR = 0, totalG = 0, totalB = 0, totalA = 0
      let pixelCount = 0
      
      for (let i = 0; i < data.length; i += 4) {
        totalR += data[i]
        totalG += data[i + 1]
        totalB += data[i + 2]
        totalA += data[i + 3]
        pixelCount++
      }
      
      const avgR = Math.round(totalR / pixelCount)
      const avgG = Math.round(totalG / pixelCount)
      const avgB = Math.round(totalB / pixelCount)
      const avgA = Math.round(totalA / pixelCount)
      
      const color = { r: avgR, g: avgG, b: avgB, a: avgA }
      setAverageColor(color)
      
      const midi = {
        r: rgbToMidi(avgR),
        g: rgbToMidi(avgG),
        b: rgbToMidi(avgB),
        a: rgbToMidi(avgA)
      }
      setMidiValues(midi)
    }
    img.src = imageSrc
  }

  const rgbToMidi = (rgb) => Math.round(rgb * (127 / 255))

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
                backgroundColor: `rgba(${averageColor.r}, ${averageColor.g}, ${averageColor.b}, ${averageColor.a})`
              }}
            ></div>
            <div className="color-info">
              <p>
                MIDI Values:
                {midiValues.r}, 
                {midiValues.g}, 
                {midiValues.b},
                {midiValues.a}
              </p>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  )
}

export default App