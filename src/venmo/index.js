'use strict';
/** @module braintree-web/venmo */

var analytics = require('../lib/analytics');
var basicComponentVerification = require('../lib/basic-component-verification');
var createDeferredClient = require('../lib/create-deferred-client');
var createAssetsUrl = require('../lib/create-assets-url');
var errors = require('./shared/errors');
var wrapPromise = require('@braintree/wrap-promise');
var BraintreeError = require('../lib/braintree-error');
var Venmo = require('./venmo');
var Promise = require('../lib/promise');
var supportsVenmo = require('./shared/supports-venmo');
var VERSION = process.env.npm_package_version;

/**
 * @static
 * @function create
 * @param {object} options Creation options:
 * @param {Client} [options.client] A {@link Client} instance.
 * @param {string} [options.authorization] A tokenizationKey or clientToken. Can be used in place of `options.client`.
 * @param {boolean} [options.allowNewBrowserTab=true] This should be set to false if your payment flow requires returning to the same tab, e.g. single page applications. Doing so causes {@link Venmo#isBrowserSupported|isBrowserSupported} to return true only for mobile web browsers that support returning from the Venmo app to the same tab.
 * @param {boolean} [options.allowWebviews=true] This should be set to false if your payment flow does not occur from within a webview that you control. Doing so causes {@link Venmo#isBrowserSupported|isBrowserSupported} to return true only for mobile web browsers that are not webviews.
 * @param {boolean} [options.ignoreHistoryChanges=false] When the Venmo app returns to the website, it will modify the hash of the url to include data about the tokenization. By default, the SDK will put the state of the hash back to where it was before the change was made. Pass `true` to handle the hash change instead of the SDK.
 * @param {string} [options.profileId] The Venmo profile ID to be used during payment authorization. Customers will see the business name and logo associated with this Venmo profile, and it will show up in the Venmo app as a "Connected Merchant". Venmo profile IDs can be found in the Braintree Control Panel. Omitting this value will use the default Venmo profile.
 * @param {string} [options.deepLinkReturnUrl] An override for the URL that the Venmo iOS app opens to return from an app switch.
 * @param {boolean} [options.requireManualReturn=false] When `true`, the customer will have to manually switch back to the browser/webview that is presenting Venmo to complete the payment.
 * @param {callback} [callback] The second argument, `data`, is the {@link Venmo} instance. If no callback is provided, `create` returns a promise that resolves with the {@link Venmo} instance.
 * @example
 * braintree.venmo.create({
 *   client: clientInstance
 * }).then(function (venmoInstance) {
 *   // venmoInstance is ready to be used.
 * }).catch(function (createErr) {
 *   console.error('Error creating Venmo instance', createErr);
 * });
 * @example <caption>Allow desktop flow to be used</caption>
 * braintree.venmo.create({
 *   client: clientInstance,
 * }).then(function (venmoInstance) {
 *   // venmoInstance is ready to be used.
 * }).catch(function (createErr) {
 *   console.error('Error creating Venmo instance', createErr);
 * });
 * @returns {(Promise|void)} Returns the Venmo instance.
 */
function create(options) {
  var name = 'Venmo';

  return basicComponentVerification.verify({
    name: name,
    client: options.client,
    authorization: options.authorization
  }).then(function () {
    var createPromise, instance;

    if (options.profileId && typeof options.profileId !== 'string') {
      return Promise.reject(new BraintreeError(errors.VENMO_INVALID_PROFILE_ID));
    }

    if (options.deepLinkReturnUrl && typeof options.deepLinkReturnUrl !== 'string') {
      return Promise.reject(new BraintreeError(errors.VENMO_INVALID_DEEP_LINK_RETURN_URL));
    }

    createPromise = createDeferredClient.create({
      authorization: options.authorization,
      client: options.client,
      debug: options.debug,
      assetsUrl: createAssetsUrl.create(options.authorization),
      name: name
    }).then(function (client) {
      var configuration = client.getConfiguration();

      options.client = client;

      if (!configuration.gatewayConfiguration.payWithVenmo) {
        return Promise.reject(new BraintreeError(errors.VENMO_NOT_ENABLED));
      }

      return client;
    });

    options.createPromise = createPromise;
    instance = new Venmo(options);

    analytics.sendEvent(createPromise, 'venmo.initialized');

    return createPromise.then(function () {
      return instance;
    });
  });
}

/**
 * @static
 * @function isBrowserSupported
 * @param {object} [options] browser support options:
 * @param {boolean} [options.allowNewBrowserTab=true] This should be set to false if your payment flow requires returning to the same tab, e.g. single page applications.
 * @param {boolean} [options.allowWebviews=true] This should be set to false if your payment flow does not occur from within a webview that you control.
 * @example
 * if (braintree.venmo.isBrowserSupported()) {
 *   // set up Venmo
 * }
 * @example <caption>Explicitly require browser support returning to the same tab</caption>
 * if (braintree.venmo.isBrowserSupported({
 *   allowNewBrowserTab: false
 * })) {
 *   // set up Venmo
 * }
 * @example <caption>Explicitly set webviews as disallowed browsers</caption>
 * if (braintree.venmo.isBrowserSupported({
 *   allowWebviews: false
 * })) {
 *   // set up Venmo
 * }
 * @returns {boolean} Whether or not the browser supports Venmo.
 */
function isBrowserSupported(options) {
  return supportsVenmo.isBrowserSupported(options);
}

module.exports = {
  create: wrapPromise(create),
  isBrowserSupported: isBrowserSupported,
  /**
   * @description The current version of the SDK, i.e. `{@pkg version}`.
   * @type {string}
   */
  VERSION: VERSION
};
