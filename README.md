# Frapps

Scripts for deployment and maintenance of ORDAO instances for [Fractal](https://optimystics.io/blog/fractalhistory) organizations and auxilary tooling around it.

* [./fractals](./fractals) - fractal definitions and their ORDAO configuration;
* [./ordao](./ordao) - ORDAO submodule;
* [./src](./src) - scripts which take care of performing the actual configuration and running of ORDAO instances based on files within `./fractals`.

You can configure ORDAO to be used by your fractal by adding a directory `./fractals/<fractal-id>/` and adding `frapp.json` file to it.


ORDAO:
* [ORDAO main branch](https://github.com/sim31/ordao/tree/main)

