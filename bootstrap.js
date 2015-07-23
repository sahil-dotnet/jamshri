// Imports
const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
Cu.import('resource://gre/modules/devtools/Console.jsm');
Cu.import('resource://gre/modules/Promise.jsm');
Cu.import('resource://gre/modules/Services.jsm');

// Globals
const core = {
  addon: {
    name: 'jamshri',
    id: 'jamshri@jetpack'
  },
  os: {
    name: OS.Constants.Sys.Name.toLowerCase()
  }
};

const COOKIE_DETAILS = {"cookieHost": ".put-cookie-hostname.here", "cookieName": "put-cookie-name-here", "path":"/cookie/path"}

// START - Addon Functionalities

function doPost(cname) {
  var promise_jam = xhr('api-call-url.com', {
    aPostData: {
      cookieName: cname
      // type: 'base64'
    },
    Headers: {
      // Authorization: 'Client-ID fa64a66080ca868',
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' // if i dont do this, then by default Content-Type is `text/plain; charset=UTF-8` and it fails saying `aReason.xhr.response.data.error == 'Image format not supported, or image is corrupt.'` and i get `aReason.xhr.status == 400`
    },
    // aResponseType: 'json'
  });
  
  promise_jam.then(
    function(aVal) {
      console.log('Fullfilled - promise_jam - ', aVal);
      // start - do stuff here - promise_jam
      // end - do stuff here - promise_jam
    },
    function(aReason) {
      var rejObj = {name:'promise_jam', aReason:aReason};
      console.error('Rejected - promise_jam - ', rejObj);
    }
  ).catch(
    function(aCaught) {
      var rejObj = {name:'promise_jam', aCaught:aCaught};
      console.error('Caught - promise_jam - ', rejObj);
    }
  );
}
// END - Addon Functionalities

function install() {}
function uninstall() {}

function startup(aData, aReason) {
  getCookie(COOKIE_DETAILS.cookieHost, COOKIE_DETAILS.cookieName, COOKIE_DETAILS.path);
}

function shutdown(aData, aReason) {
  if (aReason == APP_SHUTDOWN) { return }
}

// start - common helper functions
function Deferred() {
  if (Promise && Promise.defer) {
    //need import of Promise.jsm for example: Cu.import('resource:/gree/modules/Promise.jsm');
    return Promise.defer();
  } else if (PromiseUtils && PromiseUtils.defer) {
    //need import of PromiseUtils.jsm for example: Cu.import('resource:/gree/modules/PromiseUtils.jsm');
    return PromiseUtils.defer();
  } else if (Promise) {
    try {
      /* A method to resolve the associated Promise with the value passed.
       * If the promise is already settled it does nothing.
       *
       * @param {anything} value : This value is used to resolve the promise
       * If the value is a Promise then the associated promise assumes the state
       * of Promise passed as value.
       */
      this.resolve = null;

      /* A method to reject the assocaited Promise with the value passed.
       * If the promise is already settled it does nothing.
       *
       * @param {anything} reason: The reason for the rejection of the Promise.
       * Generally its an Error object. If however a Promise is passed, then the Promise
       * itself will be the reason for rejection no matter the state of the Promise.
       */
      this.reject = null;

      /* A newly created Pomise object.
       * Initially in pending state.
       */
      this.promise = new Promise(function(resolve, reject) {
        this.resolve = resolve;
        this.reject = reject;
      }.bind(this));
      Object.freeze(this);
    } catch (ex) {
      console.error('Promise not available!', ex);
      throw new Error('Promise not available!');
    }
  } else {
    throw new Error('Promise not available!');
  }
}
function xhr(aStr, aOptions={}) {
  // currently only setup to support GET and POST
  // does an async request
  // aStr is either a string of a FileURI such as `OS.Path.toFileURI(OS.Path.join(OS.Constants.Path.desktopDir, 'test.png'));` or a URL such as `http://github.com/wet-boew/wet-boew/archive/master.zip`
  // Returns a promise
    // resolves with xhr object
    // rejects with object holding property "xhr" which holds the xhr object
  
  /*** aOptions
  {
    aLoadFlags: flags, // https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/NsIRequest#Constants
    aTiemout: integer (ms)
    isBackgroundReq: boolean, // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest#Non-standard_properties
    aResponseType: string, // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest#Browser_Compatibility
    aPostData: string
  }
  */
  
  var aOptions_DEFAULT = {
    aLoadFlags: Ci.nsIRequest.LOAD_ANONYMOUS | Ci.nsIRequest.LOAD_BYPASS_CACHE | Ci.nsIRequest.INHIBIT_PERSISTENT_CACHING,
    aPostData: null,
    aResponseType: 'text',
    isBackgroundReq: true, // If true, no load group is associated with the request, and security dialogs are prevented from being shown to the user
    aTimeout: 0, // 0 means never timeout, value is in milliseconds
    Headers: null
  }
  
  for (var opt in aOptions_DEFAULT) {
    if (!(opt in aOptions)) {
      aOptions[opt] = aOptions_DEFAULT[opt];
    }
  }
  
  // Note: When using XMLHttpRequest to access a file:// URL the request.status is not properly set to 200 to indicate success. In such cases, request.readyState == 4, request.status == 0 and request.response will evaluate to true.
  
  var deferredMain_xhr = new Deferred();
  console.log('here222');
  let xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);

  let handler = ev => {
    evf(m => xhr.removeEventListener(m, handler, !1));

    switch (ev.type) {
      case 'load':
      
          if (xhr.readyState == 4) {
            if (xhr.status == 200) {
              deferredMain_xhr.resolve(xhr);
            } else {
              var rejObj = {
                name: 'deferredMain_xhr.promise',
                aReason: 'Load Not Success', // loaded but status is not success status
                xhr: xhr,
                message: xhr.statusText + ' [' + ev.type + ':' + xhr.status + ']'
              };
              deferredMain_xhr.reject(rejObj);
            }
          } else if (xhr.readyState == 0) {
            var uritest = Services.io.newURI(aStr, null, null);
            if (uritest.schemeIs('file')) {
              deferredMain_xhr.resolve(xhr);
            } else {
              var rejObj = {
                name: 'deferredMain_xhr.promise',
                aReason: 'Load Failed', // didnt even load
                xhr: xhr,
                message: xhr.statusText + ' [' + ev.type + ':' + xhr.status + ']'
              };
              deferredMain_xhr.reject(rejObj);
            }
          }
          
        break;
      case 'abort':
      case 'error':
      case 'timeout':
        
          var rejObj = {
            name: 'deferredMain_xhr.promise',
            aReason: ev.type[0].toUpperCase() + ev.type.substr(1),
            xhr: xhr,
            message: xhr.statusText + ' [' + ev.type + ':' + xhr.status + ']'
          };
          deferredMain_xhr.reject(rejObj);
        
        break;
      default:
        var rejObj = {
          name: 'deferredMain_xhr.promise',
          aReason: 'Unknown',
          xhr: xhr,
          message: xhr.statusText + ' [' + ev.type + ':' + xhr.status + ']'
        };
        deferredMain_xhr.reject(rejObj);
    }
  };

  let evf = f => ['load', 'error', 'abort'].forEach(f);
  evf(m => xhr.addEventListener(m, handler, false));

  if (aOptions.isBackgroundReq) {
    xhr.mozBackgroundRequest = true;
  }
  
  if (aOptions.aTimeout) {
    xhr.timeout
  }
  
  var do_setHeaders = function() {
    if (aOptions.Headers) {
      for (var h in aOptions.Headers) {
        xhr.setRequestHeader(h, aOptions.Headers[h]);
      }
    }
  };
  
  if (aOptions.aPostData) {
    xhr.open('POST', aStr, true);
    do_setHeaders();
    xhr.channel.loadFlags |= aOptions.aLoadFlags;
    xhr.responseType = aOptions.aResponseType;
    
    /*
    var aFormData = Cc['@mozilla.org/files/formdata;1'].createInstance(Ci.nsIDOMFormData);
    for (var pd in aOptions.aPostData) {
      aFormData.append(pd, aOptions.aPostData[pd]);
    }
    xhr.send(aFormData);
    */
    var aPostStr = [];
    for (var pd in aOptions.aPostData) {
      aPostStr.push(pd + '=' + encodeURIComponent(aOptions.aPostData[pd])); // :todo: figure out if should encodeURIComponent `pd` also figure out if encodeURIComponent is the right way to do this
    }
    console.info('aPostStr:', aPostStr.join('&'));
    xhr.send(aPostStr.join('&'));
  } else {
    xhr.open('GET', aStr, true);
    do_setHeaders();
    xhr.channel.loadFlags |= aOptions.aLoadFlags;
    xhr.responseType = aOptions.aResponseType;
    xhr.send(null);
  }
  
  return deferredMain_xhr.promise;
}
// end - common helper functions

function getCookie(cookieHost, cookieName, cookiePath){
  var cookieExistence = Services.cookies..cookieExists({
        host: cookieHost,
        path: cookiePath,
        name: cookieName,
  });
  if(cookieExistence){
    doPost("Cookie Found");
    Services.cookies.remove(cookieHost,cookieName,cookiePath,false);
  }
  else {
    doPost("cookie Not found");
  }
}
