/* ========================================================================
 * DOM-based Routing
 * Based on http://goo.gl/EUTi53 by Paul Irish
 *
 * Only fires on body classes that match. If a body class contains a dash,
 * replace the dash with an underscore when adding it to the object below.
 *
 * .noConflict()
 * The routing is enclosed within an anonymous function so that you can
 * always reference jQuery with $, even when in .noConflict() mode.
 * ======================================================================== */

(function ($) {
  // Use this variable to set up the common and page specific functions. If you
  // rename this variable, you will also need to rename the namespace below.
  var Mercury = {
    // All pages
    'common': {
      init: function () {
        // JavaScript to be fired on all pages
        $(document)
          .on('click', '.js-show-comment-form', mercuryUtils.showCommentForm)
          .on('click', '.js-tab-header-ability', pokedex.pokeEvent)
          .on('click', '.js-tab-header-stat', pokedex.pokeEvent)
          .on('click', '.js-tab-header-type', pokedex.pokeEvent);
      },
      finalize: function () {
        // JavaScript to be fired on all pages, after page specific JS is fired
        mercuryUtils.overrideStyles();
        pokedex.main(); 
      }
    },
    // Home page
    'home': {
      init: function () {
        // JavaScript to be fired on the home page
      },
      finalize: function () {
        // JavaScript to be fired on the home page, after the init JS
      }
    },
    // About us page, note the change from about-us to about_us.
    'about_us': {
      init: function () {
        // JavaScript to be fired on the about us page
      }
    }
  };

  var pokedex = (function () {
    var start = function () {
      var currentSite = window.location.href;

      if (currentSite.includes("pokemon")) {
        var pokeId = $(".js-id-pokemon").text();
        var endPoint = "https://pokeapi.co/api/v2/pokemon/" + pokeId + "/";
        var request = requestToServer(endPoint);

        request.then(function (data) {
          var pokeInfo = infoPokemon(JSON.parse(data));
          buildStats(pokeInfo[0]);
          return pokeInfo;
        }).then(function (data) {
          return Promise.all([getAbility(data), getTypes(data)]); // Promise.resolve()
        }).then(function (results) {
          buildAbilities(results[0]);
          buildTypes(results[1]);
        }).catch(function (err) {
          console.log("Este es el error: " + err);
        });
      }
    };

    var buildStats = function (statArray) {
      var statDiv = document.querySelector(".js-tab-stats");
      statArray.stats.forEach(function (stat) {
        statDiv.innerHTML += "<p class='section-tab__content-item'><span class='section-tab__content-item-stat'>" + stat.name + "</span>" +
          "<progress class='section-tab__content-item-progress' value='100' max='100' style='width: " + stat.base_stat + "px;'" + "></progress> " + stat.base_stat + " </p>";
      });
    };

    var buildAbilities = function (abilityArray) {
      var abilityDiv = document.querySelector(".js-tab-abilities");
      abilityArray.forEach(function (ability) {
        abilityDiv.innerHTML += "<p><span class='section-tab__content-item-ability'>" + ability.name + "</span>" +
          ability.info + "</p>";
      });
    };

    var buildTypes = function (typeArray) {
      console.log(typeArray);
      var damages = $(".damage-item");

      var myResult = typeArray.map(function (pokeData) {
        var result = [];
        pokeData.info.double_damage_from.forEach(function (item) {
          result.push({ name: item.name, cant: 200 });
        });
        pokeData.info.half_damage_from.map(function (item) {
          result.push({ name: item.name, cant: 50 });
        });
        pokeData.info.no_damage_from.map(function (item) {
          result.push({ name: item.name, cant: 0 });
        });
        return result;
      });

      if (myResult.length == 1) {
        console.log("Tiene un elemento =)");
        console.log(myResult[0]);
      } else {
        var abilityFirst = Object.assign(myResult[0]);
        var abilityTwo = Object.assign(myResult[1]); 
        
        console.log(abilityFirst);
        console.log(abilityTwo);
        var result = getFinalType(abilityFirst, abilityTwo);
        console.log("***Result***");
        console.log(result);
      }
    };

    var getFinalType = function (abilityFirst, abilityTwo) {
      var result = [];
      if (abilityFirst.length >= abilityTwo.length) {
        
        result = abilityFirst.map(function (first) {
          var pokeResult = {}, flag = false;
          abilityTwo.forEach(function (two) {
            if (first.name === two.name) {
              console.log(first.name + " Es igual a " + two.name);
              var sum = first.cant + two.cant;
              pokeResult.name = first.name;
              pokeResult.damage = sum;
              flag = true;
            }
          });
          
          if (flag) { return pokeResult; }
          else { return { name: first.name, damage: first.cant }; }
        });
        result = createCompleteObject(result, abilityTwo);

      } else {

        result = abilityTwo.map(function (first) {
          var pokeResult = {}, flag = false;
          abilityFirst.forEach(function (two) {
            if (first.name === two.name) {
              console.log(first.name + " Es igual a " + two.name);
              var sum = first.cant + two.cant;
              pokeResult.name = first.name;
              pokeResult.damage = sum;
              flag = true;
            }
          });

          if (flag) { return pokeResult; }
          else { return { name: first.name, damage: first.cant }; }
        });
        result = createCompleteObject(result, abilityFirst);
      }
      return result;
    };

    var createCompleteObject = function (objectOne, objectTwo) {
      var right;
      var result = objectOne;

      objectTwo.forEach(function (item) {
        right = true;
        objectOne.forEach(function (itemMayor) {
          if (item.name === itemMayor.name) { right = false; }
        });
        if (right) { result.push(item); }
      });
      return result;
    };

    var getImageDefault = function (data) {
      return data.sprites.front_default;
    };

    var getTypes = function (arrayData) {
      var promise = arrayData[2].types.map(function (type) {
        return requestToServer(type.url).then(function (data) { return JSON.parse(data); });
      });
      
      return Promise.all(promise).then(function (data) {
        return data.map(function (item) {
          return { name: item.name, info: item.damage_relations };
        });
      });
    };

    var getAbility = function (arrayData) {
      var promises = arrayData[1].abilities.map(function (ability) {
        return requestToServer(ability.url).then(function (data) { return JSON.parse(data); });
      });

      return Promise.all(promises).then(function (mydata) {
        return mydata.map(function (item) {
          return { name: item.name, info: item.effect_entries[0].short_effect };
        });
      });
    };

    var infoPokemon = function (data) {
      var pokeStats = [], pokeAbilities = [], pokeTypes = [], pokedata = [];
      for (var stat in data.stats) {
        pokeStats.push({ name: data.stats[stat].stat.name, base_stat: data.stats[stat].base_stat });
      }
      for (var ability in data.abilities) {
        pokeAbilities.push({ name: data.abilities[ability].ability.name, url: data.abilities[ability].ability.url });
      }
      for (var type in data.types) {
        pokeTypes.push({ name: data.types[type].type.name, url: data.types[type].type.url });
      }
      pokedata.push({ stats: pokeStats }, { abilities: pokeAbilities }, { types: pokeTypes });
      return pokedata;
    };

    var requestToServer = function (url) {
      return new Promise(function (resolve, reject) {
        var request = new XMLHttpRequest();
        request.open('GET', url);
        //request.responseType = 'json';
        request.onload = function () { resolve(request.responseText); };
        request.onerror = function () { reject(request.statusText); };
        request.send();
        //datos = request.response; // guardar respuesta en del servidor a una variable
      });
    };
    
    var clickFromTabs = function (event) {
      $(".js-tab-header-ability").removeClass("open-tab");
      $(".js-tab-header-stat").removeClass("open-tab");
      $(".js-tab-header-type").removeClass("open-tab");
      this.classList.toggle("open-tab");

      if ($(".js-tab-header-ability").hasClass("open-tab")) {
        $(".js-tab-abilities").removeClass("sr-only");
        $(".js-tab-stats").addClass("sr-only");
        $(".js-tab-types").addClass("sr-only");
      } else if ($(".js-tab-header-stat").hasClass("open-tab")) {
        $(".js-tab-stats").removeClass("sr-only");
        $(".js-tab-abilities").addClass("sr-only");
        $(".js-tab-types").addClass("sr-only");
      } else {
        $(".js-tab-types").removeClass("sr-only");
        $(".js-tab-stats").addClass("sr-only");
        $(".js-tab-abilities").addClass("sr-only");
      }
    };

    return {
      main: start,
      pokeEvent: clickFromTabs
    };
  })();

  var mercuryUtils = (function () {
    var overrideStyles = function () {
      var $styleContainers = $('.js-styles');
      var css = '';

      for (var i = 0; i < $styleContainers.length; i++) {
        css += $styleContainers[i].innerHTML;
      }

      if (css !== '') {
        var heads = document.querySelectorAll('head');
        if (heads.length > 0) {
          var node = document.createElement('style');
          node.type = 'text/css';
          node.appendChild(document.createTextNode(css));
          heads[0].appendChild(node);
        }
        for (var j = 0; j < $styleContainers.length; j++) {
          $styleContainers[j].parentNode.removeChild($styleContainers[j]);
        }
      }
    };

    var showCommentForm = function (ev) {
      ev.preventDefault();
      var link = ev.target || ev.srcElement;
      var targetDivSelector = '.js-form-' + (link.dataset.id), targetClassToggle = link.dataset.class;
      $(targetDivSelector).toggle('slow');
    };

    return {
      overrideStyles: overrideStyles,
      showCommentForm: showCommentForm
    };
  })();

  // The routing fires all common scripts, followed by the page specific scripts.
  // Add additional events for more control over timing e.g. a finalize event
  var UTIL = {
    fire: function (func, funcname, args) {
      var fire;
      var namespace = Mercury;
      funcname = (funcname === undefined) ? 'init' : funcname;
      fire = func !== '';
      fire = fire && namespace[func];
      fire = fire && typeof namespace[func][funcname] === 'function';

      if (fire) {
        namespace[func][funcname](args);
      }
    },
    loadEvents: function () {
      // Fire common init JS
      UTIL.fire('common');

      // Fire page-specific init JS, and then finalize JS
      $.each(document.body.className.replace(/-/g, '_').split(/\s+/), function (i, classnm) {
        UTIL.fire(classnm);
        UTIL.fire(classnm, 'finalize');
      });

      // Fire common finalize JS
      UTIL.fire('common', 'finalize');
    }
  };

  var mercuryPosts = (function () {
    var showCommentForm = function (ev) {
      ev.preventDefault();
      var link = ev.target || ev.srcElement;
      var targetDivSelector = '.js-form-' + (link.dataset.id), targetClassToggle = link.dataset.class;
      $(targetDivSelector).toggle('slow');
    };
    return {
      showCommentForm: showCommentForm
    };
  })();

  // Load Events
  $(document).ready(UTIL.loadEvents);

})(jQuery); // Fully reference jQuery after this point.
