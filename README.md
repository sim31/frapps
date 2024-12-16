# Frapps
[Fractal](https://optimystics.io/blog/fractalhistory) applications.

* [Concepts](./concepts/) - fractal concepts in [natural language](https://en.wikipedia.org/wiki/Natural_language);
* [Implementation](./impl/) - fractal application software;

## ORDAO
Initialize:
```
cd impl/ordao/sys/dev/ && npm run setup && npm run build
```

Tests (might take a couple of minutes):
```
cd impl/ordao/sys/dev/ && npm run test
```

Run everything locally (dev servers):
```
cd impl/ordao/sys/dev/ && npm run dev
```

## Sync command in case of missed events
```
npm run ornode-sync 129361897 <"latest" | block-num> 8000
```