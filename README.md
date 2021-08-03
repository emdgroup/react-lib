# EMD Group React Libraries

This repository contains a collection of React libraries that we have built over the years. Our focus is on the following:

* Promote and adopt modern patterns in React such as Hooks
* Limit exposure to third party libraries
* Reduce bundle size by leveraging modern bundling techniques
* TypeScript support

## Libraries

* [@emdgroup/react-storage](./packages/storage#readme) - React hooks for convenient access to localStorage and sessionStorage APIs
* [@emdgroup/react-query](./packages/query#readme) - React hooks for the fetch API with support for client-side caching
* [@emdgroup/react-auth](./packages/auth#readme) - React hooks implementing the Authorization Code Grant Flow with PKCE.

## Contributing

Contributions to the package are always welcome and can be submitted via a pull request. Please note, that you have to agree to the [Contributor License Agreement](./CONTRIBUTING.md) to contribute. A bot will require your agreement to the CLA before your pull request can be merged.

### Working with the Code

```bash
git clone https://github.com/emdgroup/react-lib.git
cd react-lib
npm install
```

Before pushing any code, please run the documentation generator:

```bash
npm -w @emdgroup/react-query run docs
```

This will update the `README.md` file with the latest documentation generated from the source code. Do not edit `README.md` directly.

