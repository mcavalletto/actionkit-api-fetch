/*********************************************************************
*
* akapi-fetch.js: Call the ActionKit API from an admin dashboard.
*
* Copyright 2024-2025 Simon Cavalletto / Green Thumb Software
*
**********************************************************************/

'use strict';

window.akapi = class AKAPIFetch {

	/* Configurable parameters */
	static allow_writes = true;
	static console_logging = true;
	static alert_on_failure = true;
	
	/* Internal state variables */
	static cached_requests = {};
	static request_counter = 0;

	/* Internal constants */
	static api_base = '/rest/v1/';
	static default_receive_for_status = {
		200: 'json',
		201: 'location',
		202: 'status',
		204: 'status',
		301: 'location',
		302: 'location',
		304: 'status',
		400: 'error',
		401: 'error',
		404: 'error',
		405: 'error',
		429: 'error',
		500: 'error',
		503: 'error',
	};
	static read_only_methods = [ 'GET', 'HEAD', 'OPTIONS', 'TRACE' ];
	static read_safe = [ new RegExp("^POST report/run/[a-zA-Z0-9\_\-]+/? ") ];

	/* Core fetch functionality */
	static async fetch (method, path, data, options) {
		const counter = ++ this.request_counter;
		const log_level = this.console_logging;

		options = options || {};

		if ( path.startsWith( this.api_base ) ) {
			path = path.substring( this.api_base.length );
		}
		var request_path = ( path.startsWith('/') || path.match(/https?:/) ) ? path : ( this.api_base + path );

		const content_type = ( method == 'GET' || options.content == 'urlencoded' ) ? 'application/x-www-form-urlencoded' : options.content || 'application/json';

		var data_string; 
		if ( data ) {
			if ( typeof(data) == 'string' ) {
				data_string = data;
			} else if ( typeof(data) != 'object' ) {
				throw new Error(`API unepected data type: ${ typeof(data) }`);
			} else if ( ! Object.keys(data).length ) {
				data_string = null;
			} else if ( content_type == 'application/x-www-form-urlencoded' ) {
				data_string = new URLSearchParams(data).toString();
			} else if ( content_type == 'application/json' ) {
				data_string = JSON.stringify(data);
			} else {
				throw new Error(`API unexpected content-type: ${ content_type }`);
			}
		}

		var cache_key = ( method + ' ' + path + ' ' + data_string );
		if ( options.cache && cache_key in this.cached_requests ) {
			return Promise.resolve( this.cached_requests[ cache_key ] )
		}
		
		if ( log_level ) {
			console.log( `AK API Call ${counter}:`, method, request_path, data_string );
		}

		var request_params = { method: method, headers: {} };
		
		if ( ! options.cache ) {
			request_params[ 'no-store' ] = 'no-store';
		}
		
		const is_read_only_method = this.read_only_methods.includes(method); 

		if ( ! this.allow_writes && ! is_read_only_method && 
						! this.read_safe.find( (rs) => rs.test(cache_key) ) ) {
			if ( log_level ) {
				console.error( `AK API Call ${counter}: Writes not allowed` );
			}
			throw new Error(`API Error: writes not enabled`);
		}

		if ( ! is_read_only_method ) {
			request_params.headers["X-CSRFToken"] = Cookies.get('csrftoken');
		}

		if ( options.receive == 'html' ) {
			request_params.headers['Accept'] = 'text/html';
		}

		if ( data_string ) {
			if ( method == 'GET' ) {
				request_path = request_path + ( (request_path.indexOf('?') == -1) ? '?' : '&' ) + data_string;
			} else {
				request_params.body = data_string;
				request_params.headers['Content-Type'] = content_type;
			}
		}

		try {
			const response = await fetch( request_path, request_params );
			if ( ! response.ok ) {
				const content = await response.text();
				throw new Error(`Response status: ${response.status} (${content})`);
			}

			if ( ! options.receive ) {
				options.receive = this.default_receive_for_status[ response.status ] || 'json'
			}
			var promise;
			if ( options.receive == 'json' ) {
				promise = response.json();
			} else if ( options.receive == 'html' ) {
				promise = response.text();
			} else if ( options.receive == 'text' ) {
				promise = response.text();
			} else if ( options.receive == 'location' ) {
				promise = Promise.resolve( response.headers.get('Location') );
			} else if ( options.receive == 'status' ) {
				promise = Promise.resolve( response.status );
			} else {
				throw new Error(`API Error: unexpected option receive='${options.receive}'`);
			}

			if ( options.cache ) {
				promise.then( function( result ) {
					if ( log_level ) {
						console.log( `AK API Call ${counter}: Completed And Cached`, ( log_level > 1 ? result : null ) );
					}
					this.cached_requests[ cache_key ] = result;
				} )
			} else {
				if ( log_level ) {
					promise.then( function( result ) {
						console.log( `AK API Call ${counter}: Completed`, ( log_level > 1 ? result : null ) );
					} );
				}
			}

			return promise;
		} catch (error) {
			if ( log_level ) {
				console.error( `AK API Call ${counter}: Error`, error.message );
			}
			if ( this.alert_on_failure ) {
				alert(`API Error: ${ error.message }`)
			}
			throw new Error(`AK API Error: ${ error.message }`);
		};
	}

	/* Method wrappers */
	static get() {
		return this.fetch('GET', ...arguments);
	}
	static post() {
		return this.fetch('POST', ...arguments);
	}
	static put() {
		return this.fetch('PUT', ...arguments);
	}
	static patch() {
		return this.fetch('PATCH', ...arguments);
	}
	static delete() {
		return this.fetch('DELETE', ...arguments);
	}

	/* Option wrappers */
	static get_cached( path, data ) {
		return this.fetch('GET', path, data, { cache: true } )
	}
	static get_html( path, data ) {
		return this.fetch('GET', path, data, { receive: 'html' } )
	}
	static post_html( path, data ) {
		return this.fetch('POST', path, data, { receive: 'html' } )
	}

};
