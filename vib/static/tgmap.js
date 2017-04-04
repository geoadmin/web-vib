var map = L.map('map');

// Mpzen Play link: https://mapzen.com/tangram/play/?scene=https%3A%2F%2Fmapzen.com%2Fapi%2Fscenes%2F46449%2F453%2Fresources%2Fbasic.yaml#7.583/46.596/8.735
var layer = Tangram.leafletLayer({
  scene: 'https://mapzen.com/api/scenes/46449/453/resources/basic.yaml'
});
layer.addTo(map);
map.setView([46.25, 7.94], 8);
