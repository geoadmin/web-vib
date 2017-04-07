// Swiss extent
var rectangle = Cesium.Rectangle.fromDegrees(5.013926957923385, 45.35600133779394, 11.477436312994008, 48.27502358353741);

// Set good time for lighting
var jD = new Cesium.JulianDate();
var d = new Date();
d.setUTCHours(8);
var jDate = Cesium.JulianDate.fromDate(d);

// Terrain
var terrain = new Cesium.CesiumTerrainProvider({
  url: '//3d.geo.admin.ch/1.0.0/ch.swisstopo.terrain.3d/default/20160115/4326/',
  availableLevels: [8, 10, 12, 14, 16, 17],
  rectangle: rectangle // Doesn't work without
});

// Swissimage WMTS
var swissimage = new Cesium.UrlTemplateImageryProvider({
  url: "//wmts{s}.geo.admin.ch/1.0.0/ch.swisstopo.swissimage-product/default/current/4326/{z}/{y}/{x}.jpeg",
  subdomains: '56789',
  availableLevels: [8, 10, 12, 14, 16, 17, 18],
  tilingScheme: new Cesium.GeographicTilingScheme({
    numberOfLevelZeroTilesX: 2,
    numberOfLevelZeroTilesY: 1
  }),
  rectangle: rectangle
});

// Swissbuildings 2.0
var buildings = new Cesium.Cesium3DTileset({
  url : 'https://vectortiles0.dev.bgdi.ch/ch.swisstopo.swisstlm3d.3d/20161217'
});

// Swissnames
var names = new Cesium.Cesium3DTileset({
  url: 'https://vectortiles1.dev.bgdi.ch/ch.swisstopo.swissnames3d.3d/20170223'
});
names.style = new Cesium.Cesium3DTileStyle({
  show: true,
  color: 'rgb(255, 255, 255)',
  outlineColor: 'rgb(0, 0, 0)',
  outlineWidth: 3,
  labelStyle: 2,
  font: "'24px arial'",
  scaleByDistanceNearRange: 1000.0,
  scaleByDistanceNearValue: 2.0,
  scaleByDistanceFarRange: 10000.0,
  scaleByDistanceFarValue: 0.4
});

window.onload = function() {
  // Viewer
  var viewer = new Cesium.Viewer('map', {
    baseLayerPicker: false,
    shadows: false,
    scene3DOnly: false,
    sceneMode: Cesium.SceneMode.MORPHING,
    mapMode2D : Cesium.MapMode2D.ROTATE,
    animation: false,
    terrainProvider: terrain,
    imageryProvider:  swissimage,
    mapProjection : new Cesium.WebMercatorProjection()
  });
  viewer.clock.currentTime = jDate;
  viewer.scene.globe.baseColor = Cesium.Color.BLUE;
  viewer.scene.backgroundColor = Cesium.Color.WHITE;
  viewer.scene.globe.depthTestAgainstTerrain = false;
  viewer.scene.primitives.add(buildings);
  viewer.scene.primitives.add(names);
  
  // MORPHING
  var is3d = true;
  $('#morph').click(function() {
    if (is3d) {
      viewer.scene.morphTo2D();
    } else {
      viewer.scene.morphTo3D();
    }
    viewer.scene.completeMorph();
    is3d = !is3d;
    zoomToSwiss();
  });

  // ZOOM
  var zoomToSwiss = function() {
	  viewer.camera.setView({
	    destination: rectangle
	  });
  };
  zoomToSwiss();
  $('#zoom').click(zoomToSwiss);

  // TOGGLE BUILDINGS
  var isBuildingsShown = true;
  var toggleBuildings = function() {
	  isBuildingsShown = !isBuildingsShown;
	  buildings.show = isBuildingsShown;
  };
  $('#toggleBuildings').click(toggleBuildings);

  // PICKING
  var canvas = viewer.canvas;
  canvas.setAttribute('tabindex', '0'); // needed to put focus on the canvas
  canvas.onclick = function() {
	  // To get key events
	  canvas.focus();
  };
  var current = {
	  feature : undefined,
	  originalColor : new Cesium.Color()
  };
  var HIGHLIGHT_COLOR = Cesium.Color.CHARTREUSE;
  var handler = new Cesium.ScreenSpaceEventHandler(canvas);
  handler.setInputAction(function(movement) {
	  var pickedFeature = viewer.scene.pick(movement.position);
	  if (Cesium.defined(current.feature) && (current.feature !== pickedFeature)) {
	    // Restore original color to feature that is no longer selected
	    // This assignment is necessary to work with the set property
	    current.feature.color = Cesium.Color.clone(current.originalColor, current.feature.color);
	    current.feature = undefined;
	  }
	  if (Cesium.defined(pickedFeature) && (pickedFeature !== current.feature)) {
	    current.feature = pickedFeature;
	    Cesium.Color.clone(pickedFeature.color, current.originalColor);

	    // Highlight newly selected feature
	    pickedFeature.color = Cesium.Color.clone(HIGHLIGHT_COLOR, pickedFeature.color);
	    //console.log(buildings.properties);
	    var properties = pickedFeature.primitive.properties;
	    console.groupCollapsed('Object picked: ' + (pickedFeature.getProperty('OBJECTID') || pickedFeature.getProperty('UUID')));
	    if (Cesium.defined(properties)) {
	    	for (var name in properties) {
		      if (properties.hasOwnProperty(name)) {
			      console.log(name + ': ' + pickedFeature.getProperty(name));
		      }
		    }
	    }
	    console.groupEnd();
	  }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
};
