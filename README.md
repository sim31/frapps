# Frapps

[Fractal](https://optimystics.io/blog/fractalhistory) applications.

**Fractals should not be constrained to any single software (including smart contract) implementation. Meaning they should be able to change all software that they use, including replacing it with a different app.**

This repository is organized with that in mind.

* [./fractals](./fractals) - fractal definitions and their configurations for apps;
* [./apps](./apps) - apps for fractals;
* [./src](./src) - scripts which take care of performing the actual configuration and running of apps based on files within `./fractals`.

You can configure an app to be used by your fractal by adding a directory `./fractals/<fractal-id>/` and adding `frapp.json` file to it. If you create a pull request like this and your request is sensible I might deploy it under https://frapps.xyz.

Ideally fractals should have definition file (also known as intent document file), which defines an off-chain consensus process for migrating between apps without forks. E.g.: [Optimism Fractal intents](./fractals/of2/intents.md). Please put these definition files under `./fractals/<fractal-id>/`

Currently supported apps:
* [ORDAO main branch](https://github.com/sim31/ordao/tree/main)

