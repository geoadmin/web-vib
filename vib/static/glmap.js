(function() {
  var params, mainStyle;
  function changeMapLang(map, lang) {
    var styleSpec, layers, langFilter, fallbackFilter;
    styleSpec = $.extend(true, {}, map.getStyle(params.style));
    layers = styleSpec.layers.slice();
    setParam(lang, 'lang');
    // Always remove previous composite layers first
    for (var i=0; i < layers.length; i++) {
      var lyr = layers[i];
      if (lyr.source == 'composite' && lyr.layout) {
        map.removeLayer(lyr.id);
      }
    }
    if (lang == 'all') {
      styleSpec = $.extend(true, {}, mainStyle);
      layers = styleSpec.layers.slice();
      for (var i=0; i < layers.length; i++) {
        var lyr = layers[i];
        if (lyr.source == 'composite' && lyr.layout) {
          map.addLayer(lyr);
        }
      }
      return
    }
    styleSpec = $.extend(true, {}, mainStyle);
    layers = styleSpec.layers.slice();
    langFilter = ['!=', lang, ''];
    fallbackFilter = ['==', lang, ''];
    for (var i=0; i < layers.length; i++) {
      var lyr = layers[i];
      if (lyr.source == 'composite' && lyr.layout) {
        var lyrLang = $.extend(true, {}, lyr);
        var fltLang = ['all', lyrLang.filter, langFilter];
        lyrLang.layout['text-field'] = '{' + lang + '}';
        lyrLang.filter = fltLang;
        lyrLang.id = lyrLang.id + '_lang';

        // Prepare fallback layer
        lyr.filter = ['all', lyr.filter, fallbackFilter];
        lyr.id = lyr.id + '_fallback';
        map.addLayer(lyrLang);
        map.addLayer(lyr);
      }
    }
  }

  function changeMap(map, styleId) {
    map.setStyle('mapbox://styles/vib2d/' + styleId);
    setParam(styleId, 'style');
  }

  function getMapFirstLayerId(map, styleId) {
    var s = map.getStyle(styleId);
    return s.layers[0].id;
  }

  function getWMSUrl(layerId) {
    return 'https://wms.geo.admin.ch?bbox={bbox-epsg-3857}&format=image/png&STYLES=&' +
        '&service=WMS&version=1.3.0&request=GetMap&crs=EPSG:3857&width=256&height=256&layers=' + layerId;
  }

  function addBackground(map, stlyeId, layerId) {
    var config = {
      'swissimage': addSwissimage,
      'pixelkarte': addPixelKarte
    };
    setParam(layerId, 'background');
    return config[layerId](map, stlyeId);
  }

  function changeBackground(map, styleId, layerId) {
    var firstLyrId = getMapFirstLayerId(map, styleId);
    map.removeLayer(firstLyrId);
    return addBackground(map, styleId, layerId);
  }

  function addSwissimage(map, styleId) {
    var firstLyrId = getMapFirstLayerId(map, styleId);
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

  function addPixelKarte(map, styleId) {
    var firstLyrId = getMapFirstLayerId(map, styleId);
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

  function initMap() {
    mapboxgl.accessToken = 'pk.eyJ1IjoidmliMmQiLCJhIjoiY2l5eTlqcGtoMDAwZzJ3cG56' +
        'emF6YmRoOCJ9.lP3KfJVHrUHp7DXIQrZYMw';

    params = getParams();
    var map = new mapboxgl.Map({
      container: 'gl-map',
      center: centerLngLat = [params.lng, params.lat],
      style: 'mapbox://styles/vib2d/' + params.style,
      // Mapbox zoom differs by one.
      zoom: params.zoom,
      interactive: true,
      minZoom: 6,
      maxZoom: 18
    });

    // Add a Swissimage layer to the map style.
    map.on('load', function() {
      // Put layer in the background
      mainStyle = $.extend(true, {}, map.getStyle(params.style));
      setParams(params);
    });

    map.on('style.load', function(e) {
      // Make a copy of the style when loaded
      mainStyle = $.extend(true, {}, map.getStyle(params.style));
      addBackground(map, params.style, params.background);
      if (params.lang && params.lang != 'all') {
        changeMapLang(map, params.lang);
      }
    });

    map.on('moveend', function(e) {
      var center = map.getCenter();
      var zoom = map.getZoom();
      setParams({
        lng: center.lng,
        lat: center.lat,
        zoom: zoom,
        lang : params.lang,
        background: params.background,
        style: params.style
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

    map.addControl(new mapboxgl.Navigation({
      position: 'top-right'
    }));
    return map;
  }

  $(window).load(function() {
    if (!mapboxgl.supported()) {
      //stop and alert user map is not supported
      alert('Your browser does not support Mapbox GL.  Please try Chrome or Firefox.');
    }
    var map = initMap();

    // Handle languages
    var selectedLang = $('.vib-langselector option[value=' + params.lang + ']');
    if (selectedLang) {
      selectedLang.prop('selected', true);
    }
    $('.vib-langselector select').change(function() {
      changeMapLang(map, this.value);
    });

    // Handle background
    var selectedBackground = $('.vib-backgroundselector option[value=' + params.background + ']');
    if (selectedBackground) {
      selectedBackground.prop('selected', true);
    }
    $('.vib-backgroundselector select').change(function() {
      changeBackground(map, params.style, this.value);
    });

    // Handle labels
    var selectedLayer = $('.vib-layerselector option[value=' + params.style + ']');
    if (selectedLayer) {
      selectedLayer.prop('selected', true);
    }
    $('.vib-layerselector select').change(function() {
      changeMap(map, this.value);
    });
  });
})();
