(function() {
  var qString, params, mainStyle;
  var dftLng = 8.25381975151518;
  var dftLat = 46.77713656930146;
  var dftZoom = 8;
  var dftStyle = 'ciz8cl2sr006o2ss3yuhvnn1f';
  var dftLang = 'all';

  function getParam(name) {
    return decodeURIComponent(
        (new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) ||
            [,""])[1].replace(/\+/g, '%20')) || null;
  }

  function getParams() {
    var lng = getParam('lng');
    var lat = getParam('lat');
    var zoom = getParam('zoom');
    var style = getParam('style');
    var lang = getParam('lang');
    return {
      lng: lng || dftLng,
      lat: lat || dftLat,
      zoom: zoom || dftZoom,
      lang: lang || dftLang,
      style: style || dftStyle,
      lang: lang || dftLang
    };
  }

  function setParam(value, key) {
    if (!qString) {
      qString = $.query.set(key, value);
    } else {
      qString = qString.set(key, value);
    }
    history.pushState({}, '', window.location.pathname + qString.toString());
  }

  function setParams(opts) {
    if (!qString) {
      qString = $.query.set('lng', opts.lng);
    } else {
      qString = qString.set('lng', opts.lng);
    }
    qString = qString.set('lat', opts.lat);
    qString = qString.set('zoom', opts.zoom);
    qString = qString.set('style', opts.style);
    qString = qString.set('lang', opts.lang);
    history.pushState({}, '', window.location.pathname + qString.toString());
  }

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
    return map.getStyle(styleId).layers[0].id;
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
        id: 'swissImage',
        source: 'swissimageWMTS',
        type: 'raster',
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
      // Temp hack because we add our custom Swissimage source
      if (e.style.stylesheet.id == dftStyle) {
        addSwissimage(map, params.style);
      }
      // Make a copy of the style when loaded
      mainStyle = $.extend(true, {}, map.getStyle(params.style));
    });

    map.on('moveend', function(e) {
      var center = map.getCenter();
      var zoom = map.getZoom();
      setParams({
        lng: center.lng,
        lat: center.lat,
        zoom: zoom,
        lang : params.lang,
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
    var selectedLang = $('.vib-langselector option[value=' + params.lang + ']');
    if (selectedLang) {
      selectedLang.prop('selected', true);
    }
    $('.vib-langselector select').change(function() {
      changeMapLang(map, this.value);
    });
    var selectedLayer = $('.vib-layerselector option[value=' + params.style + ']');
    if (selectedLayer) {
      selectedLayer.prop('selected', true);
    }
    $('.vib-layerselector select').change(function() {
      changeMap(map, this.value);
    });
  });
})();
