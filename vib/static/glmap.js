(function() {
  function textField(txt) {
    return '{' + txt + '}';
  }

  function getMapFirstLayerId(map) {
    var style = map.getStyle();
    return style.layers[0].id;
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

  function getWMSUrl(layerId) {
    return 'https://wms.geo.admin.ch?bbox={bbox-epsg-3857}&format=image/png&STYLES=&' +
        '&service=WMS&version=1.3.0&request=GetMap&crs=EPSG:3857&width=256&height=256&layers=' + layerId;
  }

  function addSwissimage(map) {
    var firstLyrId = getMapFirstLayerId(map);
    map.addSource(
      'swissimageWMTS', {
        type: 'raster',
        tiles: ['https://wmts10.geo.admin.ch/' +
            '1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg'],
        tileSize: 256
      }
    );
    map.addLayer({
        id: 'swissimage',
        source: 'swissimageWMTS',
        type: 'raster',
      }, firstLyrId);
  }

  function addPixelKarte(map) {
    var firstLyrId = getMapFirstLayerId(map);
    map.addSource(
      'pixelkarte1MWMS', {
        type: 'raster',
        tiles: [getWMSUrl('ch.swisstopo.vib2d.pk1000')],
        tileSize: 256
      }
    );
    map.addLayer({
        id: 'pixelkarte1M',
        source: 'pixelkarte1MWMS',
        type: 'raster',
        paint: {
          "raster-opacity": {
            base: 1,
            stops: [[0,1],[8.99,1],[9.0,0],[22,0]]
          }
        }
      }, firstLyrId);
    map.addSource(
      'pixelkarte500WMS', {
        type: 'raster',
        tiles: [getWMSUrl('ch.swisstopo.vib2d.pk500')],
        tileSize: 256
      }
    );
    map.addLayer({
        id: 'pixelkarte500',
        source: 'pixelkarte500WMS',
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
    return addBackground(map, layerId);
  }

  function initMap() {
    mapboxgl.accessToken = 'pk.eyJ1IjoidmliMmQiLCJhIjoiY2l5eTlqcGtoMDAwZzJ3cG56' +
        'emF6YmRoOCJ9.lP3KfJVHrUHp7DXIQrZYMw';

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

    map.on('style.load', function(e) {
      // Make a copy of the style when loaded
      addBackground(map, app.params.background);
      if (app.params.lang && app.params.lang != 'all') {
        changeMapLang(map, app.params.lang);
      }
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

    map.on('click', function(e) {
      var features = map.queryRenderedFeatures(e.point);
      if (features.length) {
        for (var i=0; i < features.length; i++) {
          var feature = features[i];
          if (feature.layer.id) {
            $('.vib-layerid').html(
                feature.properties.name + ' : ' + feature.layer.id);
            break;
          }
        }
      }
    });
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
