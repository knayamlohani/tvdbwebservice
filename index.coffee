# all data is passed and returned as strings
###

  Format for Data recieved via TVDB before processing it
  -------------------------------------------------------
  For SearchResults by series name - 
  {
    Data:
      Series : []
  }

  For Banners -
  {
    Banners:
      Banner: []
  }
  For Actor - 
  {
    Actors:
     Actor: []
  }


  For Series -
  {
    seriesData = 
      Data: Series
       ...
       ...
    ,  
    actorsData,
    bannersData
  }

  After Processing
  ----------------------------

  For SearchResults by series name - 
  {
    seriesArray: [] ---> array of series objects(basic information)
  }

  for banners -
  [] ---> array of objects of banners

  for actors -
  [] ---> array of objects of actors

  for series - 
  {
    data: '',
    ....,
    actorsDetails: [], --->objects of actors
    banners: [] --->objects of banners
  }

###
APPCONFIG = 
  tvdbApiKey: ''


http = require 'http'
express = require 'express'
app = express()


# makes http request to tvdb to get actors details for series with given id
requestActorsForSeriesWithId = (id, callback) ->
  options =
    "url"  : "http://www.thetvdb.com/api/#{APPCONFIG.tvdbApiKey}/series/#{id}/actors.xml"
    "type" : "actors"
  httpRequest options, (data) ->
    callback data
    return

# makes http request to tvdb to get banners for series with given id
requestBannersForSeriesWithId = (id, callback) ->
  options =
    "url"  : "http://www.thetvdb.com/api/#{APPCONFIG.tvdbApiKey}/series/#{id}/banners.xml"
    "type" : "banners"
  httpRequest options, (data) ->
    try
      (JSON.parse data).Banners.Banner[0].id
    catch e
      # ...
      data = JSON.stringify
       Banners: 
        Banner: []
    
    callback data
    return

# makes http request to tvdb to get details for series with given id
requestForSeriesWithId = (id, callback) ->
  options = 
    "url"  : "http://www.thetvdb.com/api/#{APPCONFIG.tvdbApiKey}/series/#{id}/all/en.xml"
    "type" : "seriesById" 
  httpRequest options, (data) ->
    callback data
    return



generateSearchResults = (data) ->
  seriesArray = []
  data = JSON.parse data

  if data and data.Data and data.Data.Series
    for series in data.Data.Series
      seriesArray.push
        "id"         : "#{series.seriesid}",
        "name"       : "#{series.SeriesName}",
        "language"   : "#{series.language}",
        "banner"     : if series.banner then "http://www.thetvdb.com/banners/#{series.banner}" else "",
        "overview"   : "#{series.Overview}",
        "firstAired" : "#{series.FirstAired}",
        "network"    : "#{series.Network}",
        "imdbId"     : "#{series.IMDB_ID}",
        "zap2itId"   : "#{series.zap2it_id}"
  JSON.stringify seriesArray

requestSeriesOnlyBy = (id, callback) ->
  options = 
    "url"  : "http://www.thetvdb.com/api/#{APPCONFIG.tvdbApiKey}/series/#{id}/all/en.xml"
    "type" : "seriesById" 
  httpRequest options, (data) ->
    #fullData object created as using the common function fro creating series only object (while requesting full data & seriesonly data)
    fullData = 
      seriesData  : JSON.parse data
    callback JSON.stringify fullData
    return


requestSeriesBy = (parameter,value,callback) ->
  options = ''
  counter = 0
  if parameter == "Name"
    options = 
      "url"  : "http://thetvdb.com/api/GetSeries.php?seriesname=#{value}"
      "type" : "seriesByName"
    
    httpRequest options, (data) ->
      
      try
        (JSON.parse data).Data.Series[0]
      catch e
        # ...
        data = JSON.stringify
          Data:
            Series : []
      
      callback data
    return
    

  else if parameter == "Id"
    
    #adds 3 parts seriesData + actors + banners
    fullData = 
      seriesData  : "" ,
      actorsData  : "" ,
      bannersData : "" 

    ((counter, fullData, callback, value) ->
      
      getFullSeriesData value
      ,

      (seriesData) ->
        fullData.seriesData = JSON.parse seriesData
        counter++
        if counter == 3
          callback JSON.stringify fullData, null , 4
        return
      ,

      (actorsData) ->
        fullData.actorsData = JSON.parse actorsData
        counter++
        if counter == 3
          callback JSON.stringify fullData, null , 4
        return
      ,

      (bannersData) ->
        fullData.bannersData = JSON.parse bannersData
        counter++
        if counter == 3
          callback JSON.stringify fullData, null , 4
        return
         
      return
    )(counter, fullData, callback,value)

  return



getFullSeriesData = (value, callback1, callback2, callback3) ->
  options = 
    "url"  : "http://www.thetvdb.com/api/#{APPCONFIG.tvdbApiKey}/series/#{value}/all/en.xml"
    "type" : "seriesById" 
  httpRequest options, (dataChunk1) ->
    callback1 dataChunk1
    return

  options =
    "url"  : "http://www.thetvdb.com/api/#{APPCONFIG.tvdbApiKey}/series/#{value}/actors.xml"
    "type" : "actors"
  httpRequest options, (dataChunk2) ->
    callback2 dataChunk2
    return
    
    
  options = 
    "url"  : "http://www.thetvdb.com/api/#{APPCONFIG.tvdbApiKey}/series/#{value}/banners.xml"
    "type" : "banners"
  httpRequest options, (dataChunk3) -> 
    callback3 dataChunk3
    return

  return  


httpRequest = (options,callback) ->
  req = http.get options.url, (res) ->
    
    data = ''
    ((data) ->
      
      res.on 'data', (xmlResult) ->
        data += xmlResult
        return

      res.on 'end', (xmlResult) ->
        data += xmlResult
        parseXML data, callback
        return

      return
    )(data)

    return   
  
  .on 'error', (error) ->
    callback JSON.stringify "", null, 4
    return

  req.end()
  return



parseXML = (xmlData, callback) ->
  {parseString} = require 'xml2js'
  parseString xmlData, (err, result) ->
    if err
      result = ""
    callback JSON.stringify result, null , 4 
    return
  return

generateSeriesPlusActorsPlusBannersObject = (data) ->

  series = JSON.parse generateSeriesOnlyObject data
  data = JSON.parse data
    
  if data.actorsData and data.actorsData.Actors
    actorsData = data.actorsData.Actors.Actor
    for actor in actorsData  
      series.actorsDetails.push JSON.parse generateActorObject JSON.stringify actor

  if data.bannersData and data.bannersData.Banners
    bannersData = data.bannersData.Banners.Banner
    for banner in bannersData
      series.banners.push JSON.parse generateBannerObect JSON.stringify banner
  
  JSON.stringify series, null, 4


generateSeriesObject = (series) ->

generateBannerObect = (banner) ->
  banner = JSON.parse banner
  JSON.stringify
    "id"           : "#{banner.id}",
    "url"          : if banner.BannerPath then "http://www.thetvdb.com/banners/#{banner.BannerPath}" else "",
    "type"         : "#{banner.BannerType}",
    "resolution"   : "#{banner.BannerType2}",
    "colors"       : "#{banner.Colors}",
    "language"     : "#{banner.Language}",
    "rating"       : "#{banner.Rating}",
    "ratingCount"  : "#{banner.RatingCount}",
    "seriesName"   : "#{banner.SeriesName}",
    "thumbnailUrl" : if banner.ThumbnailPath then "http://www.thetvdb.com/banners/#{banner.ThumbnailPath}" else "",
    "vignetteUrl"  : if banner.VignettePath then "http://www.thetvdb.com/banners/#{banner.VignettePath}" else ""

generateActorObject = (actor) ->
  actor = JSON.parse actor
  JSON.stringify
    "id"        : "#{actor.id}",
    "name"      : "#{actor.Name}",
    "role"      : "#{actor.Role}",
    "sortOrder" : "#{actor.SortOrder}",
    "imageUrl"  : if actor.Image then "http://www.thetvdb.com/banners/#{actor.Image}" else ""

generateEpisodeObject = (episode) ->
  episode = JSON.parse episode
  JSON.stringify
    "id"                    : "#{episode.id}",
    "name"                  : "#{episode.EpisodeName}",
    "number"                : "#{episode.EpisodeNumber}",
    "language"              : "#{episode.Language}",
    "airDate"               : "#{episode.FirstAired}",
    "guestStars"            : "#{episode.GuestStars}",
    "imdbId"                : "#{episode.IMDB_ID}",
    "director"              : "#{episode.Director}",
    "combinedEpisodeNumber" : "#{episode.Combined_episodenumber}",
    "combinedSeason"        : "#{episode.Combined_season}",
    "dvdChapter"            : "#{episode.DVD_chapter}",
    "dvdDiscId"             : "#{episode.DVD_discid}",
    "dvdEpisodeNumber"      : "#{episode.DVD_episodenumber}",
    "dvdSeason"             : "#{episode.DVD_season}",
    "epImgFlag"             : "#{episode.EpImgFlag}"
    "overview"              : "#{episode.Overview}",
    "productionCode"        : "#{episode.ProductionCode}",
    "rating"                : "#{episode.Rating}",
    "ratingCount"           : "#{episode.RatingCount}",
    "season"                : "#{episode.SeasonNumber}",
    "writer"                : "#{episode.Writer}",
    "absoluteNumber"        : "#{episode.absolute_number}",
    "airsAfterSeason"       : "#{episode.airsafter_season}",
    "airsBeforeSeason"      : "#{episode.airsbefore_season}",
    "airsBeforeEpisode"     : "#{episode.airsbefore_episode}",
    "thumbnailUrl"          : if episode.filename then "http://www.thetvdb.com/banners/#{episode.filename}" else ""
    "lastUpdated"           : "#{episode.lastupdated}",
    "seasonId"              : "#{episode.seasonid}",
    "seriesId"              : "#{episode.seriesid}",
    "thumbnailAdded"        : "#{episode.thumb_added}",
    "thumbnailResultion"    : "#{episode.thumb_height}x#{episode.thumb_height}"



http.createServer (req, res) ->
  ((res) ->
    requestSeries (seriesData) ->
      res.end seriesData
      return
    return
  )(res)
  return 
.listen 1337,'127.0.0.1'


generateSeriesOnlyObject = (data) ->
  series = 
    "seasons"         : [],
    "actorsDetails"   : [],
    "banners"         : []

  data = JSON.parse data
  if data.seriesData and data.seriesData.Data
    if data.seriesData.Data.Series and (data.seriesData.Data.Series)[0]
      seriesData = (data.seriesData.Data.Series)[0]
      series = 
        "id"              : "#{seriesData.id}",
        "actors"          :"#{seriesData.Actors}",
        "airsOnDayOfWeek" : "#{seriesData.Airs_DayOfWeek}",
        "airsAtTime"      : "#{seriesData.Airs_Time}",
        "contentRating"   : "#{seriesData.ContentRating}",
        "firstAired"      : "#{seriesData.FirstAired}",
        "genre"           : "#{seriesData.Genre}",
        "imdbId"          : "#{seriesData.IMDB_ID}",
        "language"        : "#{seriesData.Language}",
        "network"         : "#{seriesData.Network}",
        "networkId"       : "#{seriesData.NetworkID}",
        "overview"        : "#{seriesData.Overview}",
        "rating"          : "#{seriesData.Rating}",
        "ratingCount"     : "#{seriesData.RatingCount}",
        "runtime"         : "#{seriesData.Runtime}",
        "name"            : "#{seriesData.SeriesName}",
        "runningStatus"   : "#{seriesData.Status}",
        "added"           : "#{seriesData.added}",
        "addedBy"         : "#{seriesData.addedBy}",
        "bannerUrl"       : if seriesData.banner then "http://www.thetvdb.com/banners/#{seriesData.banner}" else ""
        "fanartUrl"       : if seriesData.fanart then "http://www.thetvdb.com/banners/#{seriesData.fanart}" else ""
        "lastUpdated"     : "#{seriesData.lastupdated}",
        "poster"          : if seriesData.poster then "http://www.thetvdb.com/banners/#{seriesData.poster}" else "",
        "zap2itId"        : "#{seriesData.zap2it_id}",
        "seasons"         : [],
        "actorsDetails"   : [],
        "banners"         : []

    if data.seriesData.Data.Episode
      episodesData = data.seriesData.Data.Episode

      episodes = []
      seasonTracker = +episodesData[0].SeasonNumber
      for episode in episodesData
        if +episode.SeasonNumber != seasonTracker
          series.seasons.push 
            "number"   : "#{seasonTracker}",
            "episodes" : episodes 
          seasonTracker++
          episodes = []
        
        episodes.push JSON.parse generateEpisodeObject JSON.stringify episode    
      
      # to push the last season        
      series.seasons.push 
        "number"   : "#{seasonTracker}",
        "episodes" : episodes    
  JSON.stringify series, null, 4



exports.setTvdbApiKey = (tvdbApiKey) ->
  APPCONFIG.tvdbApiKey = tvdbApiKey
  
exports.getSeriesByName = (name, callback) ->
  # responds to requests for series with given name
  name = encodeURIComponent(name)
  requestSeriesBy "Name", name, (seriesData) ->
    searchResults =
      "seriesArray" : JSON.parse generateSearchResults(seriesData)
    callback JSON.stringify searchResults, null, 4
    return
  return

exports.getSeriesOnlyById = (id, callback) ->
  id = encodeURIComponent(id)
  requestSeriesOnlyBy id, (seriesData) ->
    callback generateSeriesOnlyObject seriesData
    return
  return

exports.getSeriesPlusActorsPlusBannersById = (id, callback) ->
  id = encodeURIComponent(id)
  
  requestSeriesBy "Id", id, (seriesData) ->
    callback generateSeriesPlusActorsPlusBannersObject seriesData
    return
  return

exports.getActorsForSeriesWithId = (id, callback) ->
  id = encodeURIComponent(id)
  
  requestActorsForSeriesWithId id, (actorsData) ->
    actorsData = JSON.parse actorsData
    actorsArray = []

    if actorsData.Actors && actorsData.Actors.Actor
      for actor in actorsData.Actors.Actor
        actorsArray.push JSON.parse generateActorObject JSON.stringify actor

    callback JSON.stringify actorsArray, null, 4
    return
  return
  

exports.getBannersForSeriesWithId = (id, callback) ->
  id = encodeURIComponent(id)

  requestBannersForSeriesWithId id, (bannersData) ->
    bannersData = JSON.parse bannersData
    bannersArray = []
    
    if bannersData.Banners && bannersData.Banners.Banner
      for banner in bannersData.Banners.Banner
        bannersArray.push JSON.parse generateBannerObect JSON.stringify banner
    
    callback JSON.stringify bannersArray, null, 4
    return
  return





