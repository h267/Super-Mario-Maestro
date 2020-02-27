# Super-Mario-Maestro
A music level generator for Super Mario Maker and Super Mario Maker 2.

To run a local development version, start a local HTTP server with the `maestro/` folder as its root and visit the root URL of the server, which will load the file `maestro/index.html`. If you don’t already have a tool to start a local HTTP server, you can use `python -m http.server` if you have Python installed, or if you have `npm` installed, install the [`http-server`](https://www.npmjs.com/package/http-server) package and then run it with `http-server`.

You can also try opening `maestro/index.html` directly in your browser without starting a local HTTP server. Some of the functionality might be broken if you run the app this way, mostly due to CORS-related errors.
