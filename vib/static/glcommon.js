var glapi = {};

(function() {

  glapi.getMapFirstLayerId = function(map) {
    var style = map.getStyle();
    return style.layers[0].id;
  };

  glapi.getWMTSUrl = function(bodId, timestamp, format) {
    format = format ? format : 'png';
    timestamp = timestamp ? timestamp : 'current';
    var templateUrl = 'https://wmts10.geo.admin.ch/1.0.0/{bodId}/default/{timestamp}/' +
          '3857/{z}/{x}/{y}.{format}'
    return templateUrl.replace('{bodId}', bodId)
          .replace('{timestamp}', timestamp)
          .replace('{format}', format);
  };

  glapi.getWMSUrl = function(bodId) {
    return 'https://wms.geo.admin.ch?bbox={bbox-epsg-3857}&format=image/png&STYLES=&' +
        '&service=WMS&version=1.3.0&request=GetMap&crs=EPSG:3857&width=256&height=256&layers=' + bodId;
  };


  glapi.formatSourceName = function(bodId) {
    return 'source_' + bodId;
  };

  glapi.getWMTSRasterSource = function(bodId, format, timestamp) {
    return {
      type: 'raster',
      tiles: [this.getWMTSUrl(bodId, format, timestamp)],
      tileSize: 256
    };
  };

  glapi.getWMTSRasterLayer = function(bodId) {
    return {
      id: bodId,
      source: this.formatSourceName(bodId),
      type: 'raster'
    };
  };

})();
