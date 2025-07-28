document.addEventListener("DOMContentLoaded", function () {
  const imageInput = document.getElementById("imageInput");
  const previewImg = document.getElementById("previewImg");
  const imagePreview = document.getElementById("imagePreview");
  const result = document.getElementById("result");
  const colorSwatch = document.getElementById("colorSwatch");
  const hexValue = document.getElementById("hexValue");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  imageInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    console.log(file);
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImg.src = e.target.result;
        imagePreview.classList.remove("hidden");
        calculateAverageColor(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  });

  const calculateAverageColor = (imageSrc) => {
    const img = new Image();
    img.onload = () => {
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

      const hexColor = rgbToHex(avgR, avgG, avgB);

      colorSwatch.style.backgroundColor = `rgb(${avgR}, ${avgG}, ${avgB})`;
      hexValue.textContent = `MIDI Values:
        ${rgbToMidi(avgR)}, 
        ${rgbToMidi(avgG)}, 
        ${rgbToMidi(avgB)}`;

      result.classList.remove("hidden");
    };
    img.src = imageSrc;
  };

  const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const rgbToMidi = (rgb) => Math.round(rgb * (127 / 255));
});
