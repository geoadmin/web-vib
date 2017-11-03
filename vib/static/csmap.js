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
  url : 'https://vectortiles0.dev.bgdi.ch/ch.swisstopo.swisstlm3d.3d/20170425'
});

// Swissnames
var names = new Cesium.Cesium3DTileset({
  url: 'https://vectortiles1.dev.bgdi.ch/ch.swisstopo.swissnames3d.3d/20170814'
});
names.style = new Cesium.Cesium3DTileStyle({
    labelStyle: 2,
    labelText: '${DISPLAY_TEXT}',
    heightOffset:  {
      conditions : [
        ['${LOD} === "7"', 20],
        ['${LOD} === "6"', 40],
        ['${LOD} === "5"', 60],
        ['${LOD} === "4"', 80],
        ['${LOD} === "3"', 100],
        ['${LOD} === "2"', 120],
        ['${LOD} === "1"', 150],
        ['${LOD} === "0"', 200],
        ['true', '200']
      ]
    },
    disableDepthTestDistance: 5000,
    anchorLineEnabled: true,
    anchorLineColor: "color('white')",
    show: true,
    labelColor: {
      conditions : [
        //["${OBJEKTART} === 'See'", "color('blue')"],
        /*["${LOD} === '7'", "color('red')"],
            ["${LOD} === '6'", "color('green')"],
            ["${LOD} === '5'", "color('brown')"],
            ["${LOD} === '4'", "color('purple')"],
            ["${LOD} === '3'", "color('blue')"],
            ["${LOD} === '2'", "color('aqua')"],
            ["${LOD} === '1'", "color('orange')"],
            ["${LOD} === '0'", "color('black')"],*/
        ['${OBJEKTART} === "See"', 'color("blue")'],
        ['true', 'color("black")']
      ]
    },
    labelOutlineColor: 'color("white", 1)',
    labelOutlineWidth: 5,
    font:  {
      conditions : [
        ['${OBJEKTART} === "See"', '"bold 32px arial"'],
        ['${OBJEKTART} === "Alpiner Gipfel"', '"italic 32px arial"'],
        ['true', '" 32px arial"']
      ]
    },
    scaleByDistance: {
      conditions: [
        ['${LOD} === "7"', 'vec4(1000, 1, 5000, 0.4)'],
        ['${LOD} === "6"', 'vec4(1000, 1, 5000, 0.4)'],
        ['${LOD} === "5"', 'vec4(1000, 1, 8000, 0.4)'],
        ['${LOD} === "4"', 'vec4(1000, 1, 10000, 0.4)'],
        ['${LOD} === "3"', 'vec4(1000, 1, 20000, 0.4)'],
        ['${LOD} === "2"', 'vec4(1000, 1, 30000, 0.4)'],
        ['${LOD} === "1"', 'vec4(1000, 1, 50000, 0.4)'],
        ['${LOD} === "0"', 'vec4(1000, 1, 500000, 0.4)'],
        ['true', 'vec4(1000, 1, 10000, 0.4)']
      ]
    },
    translucencyByDistance: {
      conditions: [
        ['${LOD} === "7"', 'vec4(5000, 1, 5001, 1)'],
        ['${LOD} === "6"', 'vec4(5000, 1, 5001, 1)'],
        ['${LOD} === "5"', 'vec4(5000, 1, 8000, 0.4)'],
        ['${LOD} === "4"', 'vec4(5000, 1, 10000, 0.4)'],
        ['${LOD} === "3"', 'vec4(5000, 1, 20000, 0.4)'],
        ['${LOD} === "2"', 'vec4(5000, 1, 30000, 0.4)'],
        ['${LOD} === "1"', 'vec4(5000, 1, 50000, 0.4)'],
        ['${LOD} === "0"', 'vec4(5000, 1, 500000, 1)'],
        ['true', 'vec4(5000, 1, 10000, 0.5)']
      ]
    },
    distanceDisplayCondition: {
      "conditions" : [
        ['${LOD} === "7"', 'vec2(0, 5000)'],
        ['${LOD} === "6"', 'vec2(0, 5000)'],
        ['${LOD} === "5"', 'vec2(0, 8000)'],
        ['${LOD} === "4"', 'vec2(0, 10000)'],
        ['${LOD} === "3"', 'vec2(0, 20000)'],
        ['${LOD} === "2"', 'vec2(0, 30000)'],
        ['${LOD} === "1"', 'vec2(0, 50000)'],
        ['${LOD} === "0"', 'vec2(0, 500000)'],
        ['${OBJEKTART} === "Alpiner Gipfel"', 'vec2(0, 100000)']
      ]
    }
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
  viewer.scene.globe.depthTestAgainstTerrain = true;
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
