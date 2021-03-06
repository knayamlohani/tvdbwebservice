// Generated by CoffeeScript 1.8.0

/*

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
 */

(function() {
  var APPCONFIG, app, express, generateActorObject, generateBannerObect, generateEpisodeObject, generateSearchResults, generateSeriesObject, generateSeriesOnlyObject, generateSeriesPlusActorsPlusBannersObject, getFullSeriesData, http, httpRequest, parseXML, requestActorsForSeriesWithId, requestBannersForSeriesWithId, requestEpisodeAiredOnDateForSeriesWithId, requestForSeriesWithId, requestSeriesBy, requestSeriesOnlyBy;

  APPCONFIG = {
    tvdbApiKey: ''
  };

  http = require('http');

  express = require('express');

  app = express();

  requestActorsForSeriesWithId = function(id, callback) {
    var options;
    options = {
      "url": "http://thetvdb.com/api/" + APPCONFIG.tvdbApiKey + "/series/" + id + "/actors.xml",
      "type": "actors"
    };
    return httpRequest(options, function(data) {
      callback(data);
    });
  };

  requestBannersForSeriesWithId = function(id, callback) {
    var options;
    options = {
      "url": "http://thetvdb.com/api/" + APPCONFIG.tvdbApiKey + "/series/" + id + "/banners.xml",
      "type": "banners"
    };
    return httpRequest(options, function(data) {
      var e;
      try {
        (JSON.parse(data)).Banners.Banner[0].id;
      } catch (_error) {
        e = _error;
        data = JSON.stringify({
          Banners: {
            Banner: []
          }
        });
      }
      callback(data);
    });
  };

  requestForSeriesWithId = function(id, callback) {
    var options;
    options = {
      "url": "http://thetvdb.com/api/" + APPCONFIG.tvdbApiKey + "/series/" + id + "/all/en.xml",
      "type": "seriesById"
    };
    return httpRequest(options, function(data) {
      callback(data);
    });
  };

  generateSearchResults = function(data) {
    var series, seriesArray, _i, _len, _ref;
    seriesArray = [];
    data = JSON.parse(data);
    if (data && data.Data && data.Data.Series) {
      _ref = data.Data.Series;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        series = _ref[_i];
        seriesArray.push({
          "id": "" + series.seriesid,
          "name": "" + series.SeriesName,
          "language": "" + series.language,
          "banner": series.banner ? "http://thetvdb.com/banners/" + series.banner : "",
          "overview": "" + series.Overview,
          "firstAired": "" + series.FirstAired,
          "network": "" + series.Network,
          "imdbId": "" + series.IMDB_ID,
          "zap2itId": "" + series.zap2it_id
        });
      }
    }
    return JSON.stringify(seriesArray);
  };

  requestSeriesOnlyBy = function(id, callback) {
    var options;
    options = {
      "url": "http://thetvdb.com/api/" + APPCONFIG.tvdbApiKey + "/series/" + id + "/all/en.xml",
      "type": "seriesById"
    };
    return httpRequest(options, function(data) {
      var fullData;
      fullData = {
        seriesData: JSON.parse(data)
      };
      callback(JSON.stringify(fullData));
    });
  };

  requestSeriesBy = function(parameter, value, callback) {
    var counter, fullData, options;
    options = '';
    counter = 0;
    if (parameter === "Name") {
      options = {
        "url": "http://thetvdb.com/api/GetSeries.php?seriesname=" + value,
        "type": "seriesByName"
      };
      httpRequest(options, function(data) {
        var e;
        try {
          (JSON.parse(data)).Data.Series[0];
        } catch (_error) {
          e = _error;
          data = JSON.stringify({
            Data: {
              Series: []
            }
          });
        }
        return callback(data);
      });
      return;
    } else if (parameter === "Id") {
      fullData = {
        seriesData: "",
        actorsData: "",
        bannersData: ""
      };
      (function(counter, fullData, callback, value) {
        getFullSeriesData(value, function(seriesData) {
          fullData.seriesData = JSON.parse(seriesData);
          counter++;
          if (counter === 3) {
            callback(JSON.stringify(fullData, null, 4));
          }
        }, function(actorsData) {
          fullData.actorsData = JSON.parse(actorsData);
          counter++;
          if (counter === 3) {
            callback(JSON.stringify(fullData, null, 4));
          }
        }, function(bannersData) {
          fullData.bannersData = JSON.parse(bannersData);
          counter++;
          if (counter === 3) {
            callback(JSON.stringify(fullData, null, 4));
          }
        });
      })(counter, fullData, callback, value);
    }
  };

  getFullSeriesData = function(value, callback1, callback2, callback3) {
    var options;
    options = {
      "url": "http://thetvdb.com/api/" + APPCONFIG.tvdbApiKey + "/series/" + value + "/all/en.xml",
      "type": "seriesById"
    };
    httpRequest(options, function(dataChunk1) {
      callback1(dataChunk1);
    });
    options = {
      "url": "http://thetvdb.com/api/" + APPCONFIG.tvdbApiKey + "/series/" + value + "/actors.xml",
      "type": "actors"
    };
    httpRequest(options, function(dataChunk2) {
      callback2(dataChunk2);
    });
    options = {
      "url": "http://thetvdb.com/api/" + APPCONFIG.tvdbApiKey + "/series/" + value + "/banners.xml",
      "type": "banners"
    };
    httpRequest(options, function(dataChunk3) {
      callback3(dataChunk3);
    });
  };

  httpRequest = function(options, callback) {
    var req;
    req = http.get(options.url, function(res) {
      var data;
      data = '';
      (function(data) {
        res.on('data', function(xmlResult) {
          data += xmlResult;
        });
        res.on('end', function(xmlResult) {
          data += xmlResult;
          parseXML(data, callback);
        });
      })(data);
    }).on('error', function(error) {
      callback(JSON.stringify("", null, 4));
    });
    req.end();
  };

  parseXML = function(xmlData, callback) {
    var parseString;
    parseString = require('xml2js').parseString;
    parseString(xmlData, function(err, result) {
      if (err) {
        result = "";
      }
      callback(JSON.stringify(result, null, 4));
    });
  };

  generateSeriesPlusActorsPlusBannersObject = function(data) {
    var actor, actorsData, banner, bannersData, series, _i, _j, _len, _len1;
    series = JSON.parse(generateSeriesOnlyObject(data));
    data = JSON.parse(data);
    if (data.actorsData && data.actorsData.Actors) {
      actorsData = data.actorsData.Actors.Actor;
      for (_i = 0, _len = actorsData.length; _i < _len; _i++) {
        actor = actorsData[_i];
        series.actorsDetails.push(JSON.parse(generateActorObject(JSON.stringify(actor))));
      }
    }
    if (data.bannersData && data.bannersData.Banners) {
      bannersData = data.bannersData.Banners.Banner;
      for (_j = 0, _len1 = bannersData.length; _j < _len1; _j++) {
        banner = bannersData[_j];
        series.banners.push(JSON.parse(generateBannerObect(JSON.stringify(banner))));
      }
    }
    return JSON.stringify(series, null, 4);
  };

  generateSeriesObject = function(series) {};

  generateBannerObect = function(banner) {
    banner = JSON.parse(banner);
    return JSON.stringify({
      "id": "" + banner.id,
      "url": banner.BannerPath ? "http://thetvdb.com/banners/" + banner.BannerPath : "",
      "type": "" + banner.BannerType,
      "resolution": "" + banner.BannerType2,
      "colors": "" + banner.Colors,
      "language": "" + banner.Language,
      "rating": "" + banner.Rating,
      "ratingCount": "" + banner.RatingCount,
      "seriesName": "" + banner.SeriesName,
      "thumbnailUrl": banner.ThumbnailPath ? "http://thetvdb.com/banners/" + banner.ThumbnailPath : "",
      "vignetteUrl": banner.VignettePath ? "http://thetvdb.com/banners/" + banner.VignettePath : ""
    });
  };

  generateActorObject = function(actor) {
    actor = JSON.parse(actor);
    return JSON.stringify({
      "id": "" + actor.id,
      "name": "" + actor.Name,
      "role": "" + actor.Role,
      "sortOrder": "" + actor.SortOrder,
      "imageUrl": actor.Image ? "http://thetvdb.com/banners/" + actor.Image : ""
    });
  };

  generateEpisodeObject = function(episode) {
    episode = JSON.parse(episode);
    return JSON.stringify({
      "id": "" + episode.id,
      "name": "" + episode.EpisodeName,
      "number": "" + episode.EpisodeNumber,
      "language": "" + episode.Language,
      "airDate": "" + episode.FirstAired,
      "guestStars": "" + episode.GuestStars,
      "imdbId": "" + episode.IMDB_ID,
      "director": "" + episode.Director,
      "combinedEpisodeNumber": "" + episode.Combined_episodenumber,
      "combinedSeason": "" + episode.Combined_season,
      "dvdChapter": "" + episode.DVD_chapter,
      "dvdDiscId": "" + episode.DVD_discid,
      "dvdEpisodeNumber": "" + episode.DVD_episodenumber,
      "dvdSeason": "" + episode.DVD_season,
      "epImgFlag": "" + episode.EpImgFlag,
      "overview": "" + episode.Overview,
      "productionCode": "" + episode.ProductionCode,
      "rating": "" + episode.Rating,
      "ratingCount": "" + episode.RatingCount,
      "season": "" + episode.SeasonNumber,
      "writer": "" + episode.Writer,
      "absoluteNumber": "" + episode.absolute_number,
      "airsAfterSeason": "" + episode.airsafter_season,
      "airsBeforeSeason": "" + episode.airsbefore_season,
      "airsBeforeEpisode": "" + episode.airsbefore_episode,
      "thumbnailUrl": episode.filename ? "http://thetvdb.com/banners/" + episode.filename : "",
      "lastUpdated": "" + episode.lastupdated,
      "seasonId": "" + episode.seasonid,
      "seriesId": "" + episode.seriesid,
      "thumbnailAdded": "" + episode.thumb_added,
      "thumbnailResultion": "" + episode.thumb_height + "x" + episode.thumb_height
    });
  };

  http.createServer(function(req, res) {
    (function(res) {
      requestSeries(function(seriesData) {
        res.end(seriesData);
      });
    })(res);
  }).listen(1337, '127.0.0.1');

  generateSeriesOnlyObject = function(data) {
    var episode, episodes, episodesData, seasonTracker, series, seriesData, _i, _len;
    series = {
      "seasons": [],
      "actorsDetails": [],
      "banners": []
    };
    data = JSON.parse(data);
    if (data.seriesData && data.seriesData.Data) {
      if (data.seriesData.Data.Series && data.seriesData.Data.Series[0]) {
        seriesData = data.seriesData.Data.Series[0];
        series = {
          "id": "" + seriesData.id,
          "actors": "" + seriesData.Actors,
          "airsOnDayOfWeek": "" + seriesData.Airs_DayOfWeek,
          "airsAtTime": "" + seriesData.Airs_Time,
          "contentRating": "" + seriesData.ContentRating,
          "firstAired": "" + seriesData.FirstAired,
          "genre": "" + seriesData.Genre,
          "imdbId": "" + seriesData.IMDB_ID,
          "language": "" + seriesData.Language,
          "network": "" + seriesData.Network,
          "networkId": "" + seriesData.NetworkID,
          "overview": "" + seriesData.Overview,
          "rating": "" + seriesData.Rating,
          "ratingCount": "" + seriesData.RatingCount,
          "runtime": "" + seriesData.Runtime,
          "name": "" + seriesData.SeriesName,
          "runningStatus": "" + seriesData.Status,
          "added": "" + seriesData.added,
          "addedBy": "" + seriesData.addedBy,
          "bannerUrl": seriesData.banner ? "http://thetvdb.com/banners/" + seriesData.banner : "",
          "fanartUrl": seriesData.fanart ? "http://thetvdb.com/banners/" + seriesData.fanart : "",
          "lastUpdated": "" + seriesData.lastupdated,
          "poster": seriesData.poster ? "http://thetvdb.com/banners/" + seriesData.poster : "",
          "zap2itId": "" + seriesData.zap2it_id,
          "seasons": [],
          "actorsDetails": [],
          "banners": []
        };
      }
      if (data.seriesData.Data.Episode) {
        episodesData = data.seriesData.Data.Episode;
        episodes = [];
        seasonTracker = +episodesData[0].SeasonNumber;
        for (_i = 0, _len = episodesData.length; _i < _len; _i++) {
          episode = episodesData[_i];
          if (+episode.SeasonNumber !== seasonTracker) {
            series.seasons.push({
              "number": "" + seasonTracker,
              "episodes": episodes
            });
            seasonTracker++;
            episodes = [];
          }
          episodes.push(JSON.parse(generateEpisodeObject(JSON.stringify(episode))));
        }
        series.seasons.push({
          "number": "" + seasonTracker,
          "episodes": episodes
        });
      }
    }
    return JSON.stringify(series, null, 4);
  };

  exports.setTvdbApiKey = function(tvdbApiKey) {
    return APPCONFIG.tvdbApiKey = tvdbApiKey;
  };

  exports.getSeriesByName = function(name, callback) {
    name = encodeURIComponent(name);
    requestSeriesBy("Name", name, function(seriesData) {
      var searchResults;
      searchResults = {
        "seriesArray": JSON.parse(generateSearchResults(seriesData))
      };
      callback(JSON.stringify(searchResults, null, 4));
    });
  };

  exports.getSeriesOnlyById = function(id, callback) {
    id = encodeURIComponent(id);
    requestSeriesOnlyBy(id, function(seriesData) {
      callback(generateSeriesOnlyObject(seriesData));
    });
  };

  exports.getSeriesPlusActorsPlusBannersById = function(id, callback) {
    id = encodeURIComponent(id);
    requestSeriesBy("Id", id, function(seriesData) {
      callback(generateSeriesPlusActorsPlusBannersObject(seriesData));
    });
  };

  exports.getActorsForSeriesWithId = function(id, callback) {
    id = encodeURIComponent(id);
    requestActorsForSeriesWithId(id, function(actorsData) {
      var actor, actorsArray, _i, _len, _ref;
      actorsData = JSON.parse(actorsData);
      actorsArray = [];
      if (actorsData.Actors && actorsData.Actors.Actor) {
        _ref = actorsData.Actors.Actor;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          actor = _ref[_i];
          actorsArray.push(JSON.parse(generateActorObject(JSON.stringify(actor))));
        }
      }
      callback(JSON.stringify(actorsArray, null, 4));
    });
  };

  exports.getBannersForSeriesWithId = function(id, callback) {
    id = encodeURIComponent(id);
    requestBannersForSeriesWithId(id, function(bannersData) {
      var banner, bannersArray, _i, _len, _ref;
      bannersData = JSON.parse(bannersData);
      bannersArray = [];
      if (bannersData.Banners && bannersData.Banners.Banner) {
        _ref = bannersData.Banners.Banner;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          banner = _ref[_i];
          bannersArray.push(JSON.parse(generateBannerObect(JSON.stringify(banner))));
        }
      }
      callback(JSON.stringify(bannersArray, null, 4));
    });
  };

  exports.getEpisodeAiredOnDateForSeriesWithId = function(airDate, id, callback) {
    requestEpisodeAiredOnDateForSeriesWithId(airDate, id, function(episodesData) {
      var episode;
      episodesData = JSON.parse(episodesData);

      /*
      episodesArray = []
      
      for episode in episodesData
        episodesArray.push generateEpisodeObject episode
      
      callback JSON.stringify episodesArray, null, 4
       */
      episode = episodesData.Data && episodesData.Data.Episode ? episodesData.Data.Episode[0] : "";
      return callback(generateEpisodeObject(JSON.stringify(episode)));
    });
  };

  requestEpisodeAiredOnDateForSeriesWithId = function(airDate, id, callback) {
    var options;
    options = {
      "url": "http://thetvdb.com/api/GetEpisodeByAirDate.php?apikey=" + APPCONFIG.tvdbApiKey + "&seriesid=" + id + "&airdate=" + airDate,
      "type": ""
    };
    return httpRequest(options, function(data) {
      callback(data);
    });
  };

}).call(this);


//# sourceMappingURL=index.js.map
