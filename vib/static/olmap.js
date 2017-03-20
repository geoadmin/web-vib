(function() {

  function initMap() {
    var key = 'pk.eyJ1IjoidmliMmQiLCJhIjoiY2l5eTlqcGtoMDAwZzJ3cG56emF6YmRoOCJ9.lP3KfJVHrUHp7DXIQrZYMw';
    var map = olms.apply('ol-map', 'https://api.mapbox.com/styles/v1/vib2d/ciz8cl2sr006o2ss3yuhvnn1f?access_token=' + key);
    var wmtsLayer = new ol.layer.Tile({
      source: new ol.source.XYZ({
        attributions: [
          new ol.Attribution({
            html: '<a target="new"' +
            'href = "http://www.swisstopo.admin.ch/' +
            'internet/swisstopo/en/home.html">swisstopo</a>'
          })
        ],
        url: 'https://wmts10.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg'
      })
    });
    map.getLayers().setAt(0, wmtsLayer);
    var view = map.getView();
    view.setCenter([902568.527041534, 5969980.33812711]);
  }

  $(window).load(function() {
    initMap();
  });

})();
