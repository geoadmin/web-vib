Layers management using MapboxGL JS
===================================

Base configuration file
-----------------------

`vib/static/config/style.json`

This is our base configuration file and follows exactly Mapbox style specs.
It defines **all the available sources** (raster, vector and geojson).
The `layers` field is empty and is populated at application start andi/or during user interactions.

Groups configuration file
-------------------------

`vib/static/config/groups.json`

This file is used to create layer compositions (a combination of sources and layersets).
It defines **all the available layersets for each source** (1 source to N layersets).

Individual layersets
--------------------

`vib/static/config/layers/{sourceId}/{layersetId}.json`

These files contain **individual layersets** used to style a source.


GeoJONs files
-------------

`vib/static/config/geojsons/{sourceId}.geojson`

This is where geojsons are currently stored.
