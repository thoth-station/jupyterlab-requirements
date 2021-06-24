/**
 * Jupyterlab requirements.
 *
 * Jupyterlab extension for managing dependencies.
 *
 * @link   https://github.com/thoth-station/jupyterlab-requirements#readme
 * @file   Jupyterlab extension for managing dependencies.
 * @author Francesco Murdaca <fmurdaca@redhat.com>
 * @since  0.0.1
 */

/**
 * Jupyterlab tutorials: https://github.com/jupyterlab/extension-examples/blob/master/server-extension/src/handler.ts
 */

import { URLExt } from '@jupyterlab/coreutils';
import { INotification } from "jupyterlab_toastify";

import { ServerConnection } from '@jupyterlab/services';
import { PromiseDelegate } from '@lumino/coreutils';

export const THOTH_JUPYTER_INTEGRATION_API_BASE_NAME = "jupyterlab_requirements";

/**
 * Polling interval for accepted tasks [ms]
 */
const POLLING_INTERVAL = 2000;

export interface ICancellablePromise<T> {
  promise: Promise<T>;
  cancel: () => void;
}

/**
 * Call the API extension
 *
 * @param {string} endPoint : API REST end point for the extension
 * @param requestInit Initial values for the request
 * @returns {ICancellablePromise<Response>} : Cancellable response to the request
*/
export const AsyncTaskHandler = function (
  endPoint: string = '',
  requestInit: RequestInit = {}
): ICancellablePromise<Response> {
  // Make request to Jupyter API

  // Retrieve server setting
  const settings = ServerConnection.makeSettings();

  // build the full request URL
  const requestUrl = URLExt.join(
    settings.baseUrl,
    THOTH_JUPYTER_INTEGRATION_API_BASE_NAME,
    endPoint
  );

  let answer: ICancellablePromise<Response>;
  let cancelled = false;

  const promise = new PromiseDelegate<Response>();

  ServerConnection.makeRequest(requestUrl, requestInit, settings)
    .then(response => {
      console.log(response.status, endPoint)
      if ( response.status === 504 ) {
          INotification.info("Gateway Error! Try again please...")
          promise.reject(new Error("gateway_error"));
      } else if (!response.ok) {
        response
          .json()
          .then(body =>
            promise.reject(
              new ServerConnection.ResponseError(response, body.error)
            )
          )
          .catch(reason => {
            console.error(
              'Fail to read JSON response for request',
              requestInit,
              JSON.parse(JSON.stringify(reason))
            );
          });
      } else if ( response.status === 202 ) {
        const redirectUrl = response.headers.get('Location') || requestUrl;

        setTimeout(
          (endPoint: string) => {
            if (cancelled) {
              // If cancelled, tell the backend to delete the task.
              console.debug(`Request cancelled ${endPoint}.`);
            }

            answer = AsyncTaskHandler(endPoint, {});
            answer.promise
              .then(response => promise.resolve(response))
              .catch(reason => promise.reject(reason));
          },
          POLLING_INTERVAL,
          redirectUrl,
          { method: requestUrl }
        );
      } else {
        promise.resolve(response.json());
      }
    })
    .catch(reason => {
      promise.reject(new ServerConnection.NetworkError(reason));
    });

    return {
      promise: promise.promise,
      cancel: (): void => {
        cancelled = true;
        if (answer) {
          answer.cancel();
        }
        promise.reject('cancelled');
      }
    };
}

/**
 * Call the API extension
 *
 * @param endPoint API REST endpoint for the extension
 * @param requestInit Initial values for the request
 * @returns The response body interpreted as JSON
 */
export async function requestAPI<T>(
  endPoint = '',
  requestInit: RequestInit = {}
): Promise<T> {
  // Make request to Jupyter API

  // Retrieve server setting
  const settings = ServerConnection.makeSettings();

  // build the full request URL
  const requestUrl = URLExt.join(
    settings.baseUrl,
    THOTH_JUPYTER_INTEGRATION_API_BASE_NAME,
    endPoint
  );

  let response: Response;

  // Make actual request
  try {
    response = await ServerConnection.makeRequest(requestUrl, requestInit, settings);
  } catch (error) {
    throw new ServerConnection.NetworkError(error);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new ServerConnection.ResponseError(response, data.message);
  }

  return data;

}
