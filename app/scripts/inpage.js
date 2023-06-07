// need to make sure we aren't affected by overlapping namespaces
// and that we dont affect the app with our namespace
// mostly a fix for web3's BigNumber if AMD's "define" is defined...
let __define;

/**
 * Caches reference to global define object and deletes it to
 * avoid conflicts with other global define objects, such as
 * AMD's define function
 */
const cleanContextForImports = () => {
  __define = global.define;
  try {
    global.define = undefined;
  } catch (_) {
    console.warn('MetaMask - global.define could not be deleted.');
  }
};

/**
 * Restores global define object from cached reference
 */
const restoreContextAfterImports = () => {
  try {
    global.define = __define;
  } catch (_) {
    console.warn('MetaMask - global.define could not be overwritten.');
  }
};

cleanContextForImports();

/* eslint-disable import/first */
import log from 'loglevel';
import { WindowPostMessageStream } from '@metamask/post-message-stream';
import { initializeProvider } from '@metamask/providers/dist/initializeInpageProvider';
import shouldInjectProvider from '../../shared/modules/provider-injection';

// contexts
const CONTENT_SCRIPT = 'metamask-contentscript';
const INPAGE = 'metamask-inpage';

restoreContextAfterImports();

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn');

//
// setup plugin communication
//

const start = async () => {

  if (shouldInjectProvider()) {
    // console.log("jiexi - inpage")
    // setup background connection

    // console.log("page visibility", document.visibilityState, Date.now())


    // document.addEventListener('visibilitychange', () => {
    //   console.log("visibility change", document.visibilityState)
    // })

    // console.log("ready state", document.readyState)

    // document.addEventListener("readystatechange", (event) => {
    //   console.log("ready state change", document.readyState)
    //   // if (event.target.readyState === "interactive") {k
    //   //   initLoader();
    //   // } else if (event.target.readyState === "complete") {
    //   //   initApp();
    //   // }
    // });

    // document.addEventListener('visibilitychange', () => {
    //   console.log("visibility change", document.visibilityState)
    // })

    // document.addEventListener("readystatechange", (event) => {
    //   console.log("ready state change", document.readyState)
    //   // if (event.target.readyState === "interactive") {k
    //   //   initLoader();
    //   // } else if (event.target.readyState === "complete") {
    //   //   initApp();
    //   // }
    // });

    const whenActivated = new Promise((resolve) => {
      if (document.prerendering) {
        console.log("doc inpage is prerendering")
        document.addEventListener('prerenderingchange', resolve);
      } else {
        console.log("doc inpage is not prerendering")
        resolve();
      }
    });

    await whenActivated


    const metamaskStream = new WindowPostMessageStream({
      name: INPAGE,
      target: CONTENT_SCRIPT,
    });


    initializeProvider({
      connectionStream: metamaskStream,
      logger: log,
      shouldShimWeb3: true,
    });
  }
}

start()
