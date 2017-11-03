(function() {
  function textField(txt) {
    return '{' + txt + '}';
  }

  function getLayersByTypes(map, types) {
    var lyrs = [];
    var style = map.getStyle();
    for (var i = 0; i < style.layers.length; i++) {
      if (types.indexOf(style.layers[i].type) > -1) {
        lyrs.push(style.layers[i].id);
      }
    }
    return lyrs;
  }

  function changeMapLang(map, lang) {
    var style = map.getStyle();
    var lyrs = getLayersByTypes(map, ['line', 'symbol']);
    var layoutVal = textField(lang == 'all' ? 'name' : lang);
    for (var i=0; i < lyrs.length; i++) {
      var lyr = style.layers[i];
      if (lyr.layout && lyr.layout['text-field'] != layoutVal) {
        map.setLayoutProperty(lyr.id, 'text-field', layoutVal);
      }
    }
    app.setParam(lang, 'lang');
  }

  function changeMap(map, styleId) {
    if (map.getStyle().id != styleId) {
      map.setStyle('mapbox://styles/vib2d/' + styleId);
      app.setParam(styleId, 'style');
    }
  }

  function addSwissimage(map) {
    var bodId = 'ch.swisstopo.swissimage';
    var firstLyrId = glapi.getMapFirstLayerId(map);
    map.addSource(glapi.formatSourceName(bodId),
        glapi.getWMTSRasterSource(bodId, 'current', 'jpeg')
    );
    map.addLayer(glapi.getWMTSRasterLayer(bodId), firstLyrId);
  }

  function addPixelKarte(map) {
    var bodId = 'ch.swisstopo.vib2d.pk1000';
    var firstLyrId = glapi.getMapFirstLayerId(map);
    map.addSource(
      glapi.formatSourceName(bodId), {
        type: 'raster',
        tiles: [glapi.getWMSUrl(bodId)],
        tileSize: 256
      }
    );
    map.addLayer({
        id: bodId,
        source: glapi.formatSourceName(bodId),
        type: 'raster',
        paint: {
          "raster-opacity": {
            base: 1,
            stops: [[0,1],[8.99,1],[9.0,0],[22,0]]
          }
        }
      }, firstLyrId);
    bodId = 'ch.swisstopo.vib2d.pk500';
    map.addSource(
      glapi.formatSourceName(bodId), {
        type: 'raster',
        tiles: [glapi.getWMSUrl(bodId)],
        tileSize: 256
      }
    );
    map.addLayer({
        id: bodId,
        source: glapi.formatSourceName(bodId),
        type: 'raster',
        paint: {
          "raster-opacity": {
            base: 1,
            stops: [[0,0],[8.99,0],[9.0,1],[22,1]]
          }
        }
      }, firstLyrId);
  }

  function addBackground(map, layerId) {
    var config = {
      'swissimage': addSwissimage,
      'pixelkarte': addPixelKarte
    };
    app.setParam(layerId, 'background');
    return config[layerId](map);
  }

  function changeBackground(map, layerId) {
    var rasterMaps = getLayersByTypes(map, ['raster']);
    for (var i = 0; i < rasterMaps.length; i++) {
      map.removeLayer(rasterMaps[i]);
    }
    var bgIdToLayerId = {
      'swissimage': ['ch.swisstopo.swissimage'],
      'pixelkarte': ['ch.swisstopo.vib2d.pk500', 'ch.swisstopo.vib2d.pk1000']
    }
    for (var i = 0; i < bgIdToLayerId[app.params.background].length; i++) {
      var sourceId = glapi.formatSourceName(
          bgIdToLayerId[app.params.background][i]);
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    }
    return addBackground(map, layerId);
  }

  function geojsonDragAndDrop(map) {
    // Mapbox GL JS uses geojson-vt behind the scene
    // https://www.mapbox.com/blog/introducing-geojson-vt/
    // Only support Linestring for the demo
    var canvas = map.getCanvas();
    canvas.ondragover = function() {
      this.id = 'gl-hover';
      return false;
    };
    canvas.ondragend = function() {
      this.id = '';
      return false;
    };
    canvas.onmouseout = function() {
      this.id = '';
    };
    canvas.ondrop = function(e) {
      var that = this;
      var reader = new FileReader();
      var filename = e.dataTransfer.files[0].name;
      reader.onload = function(event) {
        var data = JSON.parse(event.target.result);
        map.addLayer({
          "id": filename,
          "type": "line",
          "source": {
            "type": "geojson",
            "data": data
          },
          "layout": {
            "line-join": "round",
            "line-cap": "round"
          },
          "paint": {
            "line-color": "aquamarine",
            "line-width": 2
          }
        });
        that.id = '';
      };
      reader.onerror = function() {
        that.id = '';
      };
      reader.readAsText(e.dataTransfer.files[0]);

      e.preventDefault();
      return false;
    };
  }

  function initMap() {
    mapboxgl.accessToken = glapi.accessToken;

    app.getParams();
    var map = new mapboxgl.Map({
      container: 'gl-map',
      center: centerLngLat = [app.params.lng, app.params.lat],
      style: 'mapbox://styles/vib2d/' + app.params.style,
      // Mapbox zoom differs by one.
      zoom: app.params.zoom,
      interactive: true,
      minZoom: 6,
      maxZoom: 18
    });

    map.on('load', function(e) {
      // Make a copy of the style when loaded
      addBackground(map, app.params.background);
      if (app.params.lang && app.params.lang != 'all') {
        changeMapLang(map, app.params.lang);
      }
      // Attach drag and drop listener
      geojsonDragAndDrop(map);
    });

    map.on('moveend', function(e) {
      var center = map.getCenter();
      var zoom = map.getZoom();
      app.setParams({
        lng: center.lng,
        lat: center.lat,
        zoom: zoom,
        lang : app.params.lang,
        background: app.params.background,
        style: app.params.style
      });
    });
    glapi.attachMapClickListener(map);
    map.addControl(new mapboxgl.NavigationControl());
    map.addControl(new mapboxgl.FullscreenControl());
    return map;
  }

  $(window).load(function() {
    if (!mapboxgl.supported()) {
      //stop and alert user map is not supported
      alert('Your browser does not support Mapbox GL.  Please try Chrome or Firefox.');
    }

    var map = initMap();
    // Handle languages
    var selectedLang = $('.vib-langselector option[value=' + app.params.lang + ']');
    if (selectedLang) {
      selectedLang.prop('selected', true);
    }
    $('.vib-langselector select').change(function() {
      changeMapLang(map, this.value);
    });

    // Handle background
    var selectedBackground = $('.vib-backgroundselector option[value=' + app.params.background + ']');
    if (selectedBackground) {
      selectedBackground.prop('selected', true);
    }
    $('.vib-backgroundselector select').change(function() {
      changeBackground(map, this.value);
    });

    // Handle labels
    var selectedLayer = $('.vib-layerselector option[value=' + app.params.style + ']');
    if (selectedLayer) {
      selectedLayer.prop('selected', true);
    }
    $('.vib-layerselector select').change(function() {
      changeMap(map, this.value);
    });
  });
})();
