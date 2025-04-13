# actionkit-api-fetch — Call the AK API from Dashboard Reports

The akapi-fetch.js library makes it easy to call the ActionKit API from an admin dashboard using JavaScript.

## Integration

To load akapi-fetch.js, you can load a copy of the library from this site, or you can make a copy of the library and host it elsewhere, such as your instance’s S3 bucket.

```html
  <script src="https://greenthumbsoftware.com/akjs/akapi-fetch.js"></script>
```

However, in practice, we typically will want to run a bunch of JavaScript code as soon as that library has been loaded; since the ActionKit admin interface loads jQuery, we can use the simple idiom it provides for this:

```html
  <script>
    $.getScript( 'https://greenthumbsoftware.com/akjs/akapi-fetch.js' )
    .then( async function () {
      ...
    } );
  </script>
```

## Request Methods

Once the library is loaded, you can issue requests and wait for their results using the following methods:

```js
  results = await akapi.get( path, params );
  results = await akapi.post( path, params );
  results = await akapi.patch( path, params );
  results = await akapi.put( path, params );
  results = await akapi.delete( path, params );
```

Depending on the method called, the results will either hold a representation of the relevant resources, or a request status code such as 202, or the URL for a resource that has been created or updated; see the ActionKit documentation for additional details.

There’s also a more-general fetch call which allows the method to be passed as an argument.

```js
  results = await akapi.fetch( method, path, params, options );
```

The options argument is usually omitted, but when needed you can provide a reference to an object with values for one or both of these keys:

* cache: Pass a true value to have the results of the request cached and reused if you issue the same request again in the future.
* receive: Pass “html” to retrieve report results as formatted HTML instead of raw data.

There are also wrapper methods that enable those option:

```js
  results = await akapi.get_cached( path, params );
  results = await akapi.get_html( path, params );
  results = await akapi.post_html( path, params );
```

## Callback Invocation with Then

As shown by the use of await above, the request methods operate asynchronously, returning a promise which will be resolved when a response is received from the server.

If you don’t want to use JavaScript’s async / await syntax, you can also invoke these methods and set up callbacks using the Promise / then syntax:

```js
  akapi.get( path, params ).then( function ( results ) { ... } );
```

These two approaches are equivalent, but the async syntax is a bit simpler.

## Configuration Parameters

There are three global parameters you can set to change the library’s behavior:

```js
  akapi.allow_writes = [ true | false ]
  akapi.console_logging = [ true | false | 2 ]
  akapi.alert_on_failure = [ true | false ]
```

All of these parameters default to true, but can be overridden as follows:

* Set allow_writes to false to cause an exception on POST/PATCH/PUT requests.
* Set console_logging to false to disable the default logging of API requests to the browser console, or set it to 2 to cause the logging to include the values of responses.
* Set alert_on_failure to false to disable the default use of browser alerts to notify the user of a failed API request.

## Error Handling

As noted above, by default akapi-fetch.js pops up a browser alert if an API call fails. You can override that behavior and provide your own error handling as shown below:

```js
  akapi.alert_on_failure = false;
  try {
      result = await akapi.get( path, params );
  } catch {
      ... something went wrong ...
  }
```

## Examples

Sample code for interactive dashboards is available from the [library's announcements page](https://greenthumbsoftware.com/making-actionkit-api-calls-from-interactive-dashboards-with-akapi-fetch-js/).

## Author and License

Developed by Simon Cavalletto of [Green Thumb Software](https://greenthumbsoftware.com). Released freely under the MIT License. 
