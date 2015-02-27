Description
===========

A simple way to download information of TV Shows available on TVDB database 

Installation
============

Simplest way to install `tvdbwebservice` is to use [npm](http://npmjs.org), just `npm
install tvdbwebservice` which will download tvdbwebservice and all dependencies.

Usage
=====

No extensive tutorials required. Here's some examples.

Just Start Using
----------------------

Initialize your App


```coffeescript
tvdbWebService = require 'tvdbwebservice'
tvdbWebService.setTvdbApiKey 'yourTvdbApiKey'

```

To Search for a Series just provide its name

```coffeescript
tvdbWebService.getSeriesByName name, (data) ->
  console.log data
  return

```

Download Series Information using its TVDB ID 

```coffeescript
tvdbWebService.getSeriesOnlyById id, (data) ->
  console.log data
  return

```

Download Complete Series Information along with Cast Description
and Banners

```coffeescript
tvdbWebService.getSeriesPlusActorsPlusBanners id, (data) ->
  console.log data
  return

```

Download All Banners using Series TVDB ID

```coffeescript
tvdbWebService.getBannersForSeriesWithId id, (data) ->
  console.log data
  return

```

Download Cast Description using Series TVDB ID

```coffeescript
tvdbWebService.getActorsForSeriesWithId id, (data) ->
  console.log data
  return

```

Download details for Episode aired on a given Date for Series with ID

```coffeescript
tvdbWebService.getEpisodeAiredOnDateForSeriesWithId airDate, id, (data) ->
  console.log data
  return

```




So you wanna some JSON?
-----------------------

Just parse the the data received `JSON.parse(data)` to get the result in JSON form

