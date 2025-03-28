const slider = document.getElementById('mySlider');
const output = document.getElementById('sliderValue');

slider.addEventListener('input', function() {
  output.textContent = this.value;
});