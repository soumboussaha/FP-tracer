
const path = require('path')

const profileRoot = path.join('bin', 'browser-profiles')
const tempRoot = "/tmp"


const scanProfiles = {
  'checkForCompatibleBanner':
  {
    'scanName': 'checkForCompatibleBanner',
    'browserProfilePath': path.join(profileRoot, 'filter-crawl.zip'),
    'browserProfileName': 'filter-crawl',
    'useFoxhound': false,
    'headless': true
  },
  'acceptAll':
  {
    'scanName': 'acceptAll',
    'browserProfilePath': path.join(profileRoot, 'accept-all-crawl.zip'),
    'browserProfileName': 'accept-all-crawl',
    'useFoxhound': true,
    'headless': true
  },
  'rejectAll':
  {
    'scanName': 'rejectAll',
    'browserProfilePath': path.join(profileRoot, 'reject-all-crawl.zip'),
    'browserProfileName': 'reject-all-crawl',
    'useFoxhound': true,
    'headless': true
  },
  'doNothing':
  {
    'scanName': 'doNothing',
    'browserProfilePath': path.join(profileRoot, 'do-nothing-crawl.zip'),
    'browserProfileName': 'do-nothing-crawl',
    'useFoxhound': true,
    'headless': true
  },
  'manualMode':
  {
    'scanName': 'manualMode',
    'browserProfilePath': path.join(profileRoot, 'do-nothing-crawl.zip'),
    'browserProfileName': 'do-nothing-crawl',
    'useFoxhound': true,
    'headless': false
  }
};

const relevantSources = [
  'AudioContext.baseLatency',
  'AudioContext.outputLatency',
  'AudioDestinationNode.maxChannelCount',
  'AudioNode.channelCount',
  'AudioNode.numberOfInputs',
  'AudioNode.numberOfOutputs',
  'BaseAudioContext.currentTime',
  'BaseAudioContext.sampleRate',
  'History.length',
  'HTMLCanvasElement.toDataURL',
  'HTMLElement.offsetHeight',
  'HTMLElement.offsetWidth',
  'Navigator.appCodeName',
  'Navigator.appName',
  'Navigator.appVersion',
  'Navigator.buildID',
  'Navigator.doNotTrack',
  'Navigator.hardwareConcurrency',
  'Navigator.language',
  'Navigator.maxTouchPoints',
  'Navigator.oscpu',
  'Navigator.platform',
  'Navigator.product',
  'Navigator.productSub',
  'Navigator.userAgent',
  'Navigator.vendor',
  'Navigator.vendorSub',
  'Screen.availHeight',
  'Screen.availWidth',
  'Screen.colorDepth',
  'Screen.colorDepth',
  'Screen.height',
  'Screen.height',
  'Screen.pixelDepth',
  'Screen.width',
  'Screen.width',
  'VisualViewport.Height',
  'VisualViewport.OffsetLeft',
  'VisualViewport.OffsetTop',
  'VisualViewport.PageLeft',
  'VisualViewport.PageTop',
  'VisualViewport.Scale',
  'VisualViewport.Width',
  'WebGLRenderingContext.getParameter',
  'WebGLShaderPrecisionFormat.precisionWebGLShaderPrecisionFormat',
  'WebGLShaderPrecisionFormat.rangeMaxWebGLShaderPrecisionFormat',
  'WebGLShaderPrecisionFormat.rangeMinWebGLShaderPrecisionFormat',
  'Window.DevicePixelRatio',
  'Window.InnerHeight',
  'Window.InnerWidth',
  'Window.OuterHeight',
  'Window.OuterWidth',
  'Window.PageXOffset',
  'Window.PageYOffset',
  'Window.ScreenLeft',
  'Window.ScreenTop',
  'Window.ScreenX',
  'Window.ScreenY',
  'Window.ScrollX',
  'Window.ScrollY',
]

const relevantSinks = [
  'fetch.url',
  'fetch.body',
  'XMLHttpRequest.open(url)',
  'XMLHttpRequest.send',
  'XMLHttpRequest.open(username)',
  'XMLHttpRequest.open(password)',
  'XMLHttpRequest.setRequestHeader(value)',
  'XMLHttpRequest.setRequestHeader(name)',
  'media.src',
  'embed.src',
  'iframe.src',
  'img.src',
  'img.srcset',
  'script.src',
  'source.src',
  'source.srcset',
  'track.src',
  'object.data',
  'document.cookie',
  'navigator.sendBeacon(url)',
  'navigator.sendBeacon(body)',
  'WebSocket',
  'WebSocket.send'
]

const secondaryPageCount = 3

const timePerPage = 10000

const timePerFirstPage = 20000

let foxhoundPath = undefined

const setFoxhoundPath = (path) => {
  foxhoundPath = path
}

const getFoxhoundPath = (path) => {
  if (foxhoundPath) {
    return foxhoundPath
  } else {
    throw 'Must set path to foxhound executable using environment variable or parameter'
  }
}

// double default timeout because foxhound is quite slow
const navigationOptions = {
    timeout: 60 * 1000
}


module.exports = {

  profileRoot: profileRoot,

  tempRoot: tempRoot,

  scanProfiles: scanProfiles,

  relevantSinks: relevantSinks,

  relevantSources: relevantSources,

  secondaryPageCount: secondaryPageCount,

  timePerPage: timePerPage,

  timePerFirstPage:timePerFirstPage,

  setFoxhoundPath: setFoxhoundPath,

  getFoxhoundPath: getFoxhoundPath,

  navigationOptions: navigationOptions,

}