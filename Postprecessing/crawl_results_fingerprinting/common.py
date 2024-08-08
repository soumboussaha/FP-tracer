from math import ceil
import pandas as pd
import matplotlib as mpl
from matplotlib.patches import Patch
from matplotlib.ticker import FormatStrFormatter
from matplotlib.figure import Figure
import textwrap
from pandas import Series


otherStrings = {'other', 'Other', 'Otherother'}


tldNonEuropeanString = 'Non-European'
tldEuropeanString = 'European'
tldErrorString = '--ERROR--'
tldOtherString = 'Other'
tldInternationalString = 'International'

tldMapTldCategory = {
    'br': tldNonEuropeanString,
    'cn': tldNonEuropeanString,
    'co': tldNonEuropeanString,
    'com': tldInternationalString,
    'de': tldEuropeanString,
    'edu': tldNonEuropeanString,
    'fr': tldEuropeanString,
    'gov': tldNonEuropeanString,
    'io': tldInternationalString,
    'jp': tldNonEuropeanString,
    'net': tldInternationalString,
    'org': tldInternationalString,
    'other': tldOtherString,
    'ru': tldNonEuropeanString,
    'uk': tldEuropeanString,
    'in': tldNonEuropeanString,
}

tldCategoryMapColor = {
    tldNonEuropeanString: '#EE7C0E',
    tldEuropeanString: '#003688',
    tldErrorString: '#E32017',
    tldOtherString: '#A0A5A9',
    tldInternationalString: '#00782A',
}

consentModeNames = {
    'acceptAll': 'accept all',
    'rejectAll': 'reject all',
    'doNothing': 'do nothing',
}

rejectAllColor = '#00782A'
doNothingColor = '#EE7C0E'
acceptAllColor = '#003688'

rdaColors = [rejectAllColor, doNothingColor, acceptAllColor]
adrColors = [acceptAllColor, doNothingColor, rejectAllColor]


consentModeErrorString = '--ERROR--'

tldCategoryHandles = [
    Patch(
        facecolor=tldCategoryMapColor[tldEuropeanString], label=tldEuropeanString),
    Patch(
        facecolor=tldCategoryMapColor[tldInternationalString], label=tldInternationalString),
    Patch(
        facecolor=tldCategoryMapColor[tldNonEuropeanString], label=tldNonEuropeanString),
    Patch(facecolor=tldCategoryMapColor[tldOtherString], label=tldOtherString),
]


rank_group_bins = range(0, 100001, 10000)


def getTldCategory(tld: str):
    return tldMapTldCategory.get(tld, tldErrorString)


def getTldCategoryColor(tld: str):
    return tldCategoryMapColor[tldMapTldCategory.get(tld, tldErrorString)]


def keyOthersToEnd(index: pd.Index) -> pd.Index:
    return ['zz'+x if (x in otherStrings) else x for x in index]


def keyAddTldCategory(index: pd.Index) -> pd.Index:
    return [getTldCategory(x) for x in index]


def keyTldCategory(index: pd.Index) -> pd.Index:
    return keyOthersToEnd(keyAddTldCategory(index))


def consentModeKeyToName(key: str) -> str:
    return consentModeNames.get(key, consentModeErrorString)


def pageKeyToName(key: int) -> str:
    keyNum = int(key)
    if keyNum < 0:
        raise ValueError('key must not be negative')
    elif keyNum == 0:
        return 'home page (first load)'
    elif keyNum == 1:
        return 'home page (reload)'
    else:
        return f'secondary page #{keyNum-1}'


DEFAULT_REQUIRED_SOURCES = 6
DEFAULT_SCORE = ceil(1 / DEFAULT_REQUIRED_SOURCES * 100) / 100

sourceScores = {
    'AudioContext.baseLatency': DEFAULT_SCORE,
    'AudioContext.outputLatency': DEFAULT_SCORE,
    'AudioDestinationNode.maxChannelCount': DEFAULT_SCORE,
    'AudioNode.channelCount': DEFAULT_SCORE,
    'AudioNode.numberOfInputs': DEFAULT_SCORE,
    'AudioNode.numberOfOutputs': DEFAULT_SCORE,
    'BaseAudioContext.currentTime': DEFAULT_SCORE,
    'BaseAudioContext.sampleRate': DEFAULT_SCORE,
    'History.length': DEFAULT_SCORE,
    'HTMLCanvasElement.toDataURL': DEFAULT_SCORE * 5,
    'HTMLElement.offsetHeight': DEFAULT_SCORE,
    'HTMLElement.offsetWidth': DEFAULT_SCORE,
    'Navigator.appCodeName': DEFAULT_SCORE,
    'Navigator.appName': DEFAULT_SCORE,
    'Navigator.appVersion': DEFAULT_SCORE,
    'Navigator.buildID': DEFAULT_SCORE,
    'Navigator.doNotTrack': DEFAULT_SCORE,
    'Navigator.hardwareConcurrency': DEFAULT_SCORE,
    'Navigator.language': DEFAULT_SCORE,
    'Navigator.maxTouchPoints': DEFAULT_SCORE,
    'Navigator.oscpu': DEFAULT_SCORE,
    'Navigator.platform': DEFAULT_SCORE,
    'Navigator.product': DEFAULT_SCORE,
    'Navigator.productSub': DEFAULT_SCORE,
    'Navigator.userAgent': DEFAULT_SCORE,
    'Navigator.vendor': DEFAULT_SCORE,
    'Navigator.vendorSub': DEFAULT_SCORE,
    'Screen.availHeight': DEFAULT_SCORE,
    'Screen.availWidth': DEFAULT_SCORE,
    'Screen.colorDepth': DEFAULT_SCORE,
    'Screen.colorDepth': DEFAULT_SCORE,
    'Screen.height': DEFAULT_SCORE,
    'Screen.height': DEFAULT_SCORE,
    'Screen.pixelDepth': DEFAULT_SCORE,
    'Screen.width': DEFAULT_SCORE,
    'Screen.width': DEFAULT_SCORE,
    'VisualViewport.Height': DEFAULT_SCORE,
    'VisualViewport.OffsetLeft': DEFAULT_SCORE,
    'VisualViewport.OffsetTop': DEFAULT_SCORE,
    'VisualViewport.PageLeft': DEFAULT_SCORE,
    'VisualViewport.PageTop': DEFAULT_SCORE,
    'VisualViewport.Scale': DEFAULT_SCORE,
    'VisualViewport.Width': DEFAULT_SCORE,
    'WebGLRenderingContext.getParameter': DEFAULT_SCORE,
    'WebGLShaderPrecisionFormat.precisionWebGLShaderPrecisionFormat': DEFAULT_SCORE,
    'WebGLShaderPrecisionFormat.rangeMaxWebGLShaderPrecisionFormat': DEFAULT_SCORE,
    'WebGLShaderPrecisionFormat.rangeMinWebGLShaderPrecisionFormat': DEFAULT_SCORE,
    'Window.DevicePixelRatio': DEFAULT_SCORE,
    'Window.InnerHeight': DEFAULT_SCORE,
    'Window.InnerWidth': DEFAULT_SCORE,
    'Window.OuterHeight': DEFAULT_SCORE,
    'Window.OuterWidth': DEFAULT_SCORE,
    'Window.PageXOffset': DEFAULT_SCORE,
    'Window.PageYOffset': DEFAULT_SCORE,
    'Window.ScreenLeft': DEFAULT_SCORE,
    'Window.ScreenTop': DEFAULT_SCORE,
    'Window.ScreenX': DEFAULT_SCORE,
    'Window.ScreenY': DEFAULT_SCORE,
    'Window.ScrollX': DEFAULT_SCORE,
    'Window.ScrollY': DEFAULT_SCORE,
}


def isFingerprinting(sources) -> bool:
    distinctFpAttr = set(sources)
    # return len(distinctFpAttr) > 5
    score = 0
    for source in distinctFpAttr:
        score += sourceScores[source]
    return score >= 1


def concatUnique(sources, minimumBeforeAny=0, textwrapThreshold=100) -> bool:
    distinctFpAttr = sorted(set(sources))
    if len(distinctFpAttr) <= minimumBeforeAny:
        return f'Any {len(distinctFpAttr)}'
    else:
        return '\n'.join(textwrap.wrap(', '.join(distinctFpAttr), textwrapThreshold))


def otherSeries(seriesToBeOthered: Series, valuesToKeep: int, otherName: str = 'other'):
    otherStrings.add(otherName)
    seriesToBeOthered_value_counts = seriesToBeOthered.value_counts()
    min_val = seriesToBeOthered_value_counts[valuesToKeep]
    keep_vals = seriesToBeOthered_value_counts[seriesToBeOthered_value_counts > min_val]
    otheredSeries = seriesToBeOthered.copy()
    otheredSeries[~(otheredSeries.isin(keep_vals.index))
                  & ~otheredSeries.isna()] = otherName
    return otheredSeries


def randomN(all: Series, n) -> bool:
    randomSelection = all.sample(frac=1, random_state=0).head(n)
    return ', '.join(randomSelection)


def flatten(l):
    return [item for sublist in l for item in sublist]


thousandsGroupingFormatter = mpl.ticker.FuncFormatter(
    lambda x, p: '$'+format(int(x), ',').replace(',', '\,')+'$')

integerFormatter = FormatStrFormatter('%d')


def saveFigure(fig: Figure, name: str):
    fig.savefig('images/' + name + '.pdf')
    fig.savefig('images/' + name + '.svg')
