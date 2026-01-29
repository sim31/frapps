# Documentation
Now let's create proper documentation for this repo.

## Minimum requirements for the documentation
* README.md should contain all the documentation or it should be clear index for that documentation;
* Prerequisites to run this repo (like linux server and nginx);
* Instalation and setup (running init / update scripts, orfrapps-alias)
* orfrapps cli tool reference doc;
* Documentation of all config options for frapp.json (@frapp.ts ) and frapp.local.json (@ordaoLocalCfg.ts )

Separate walkthroughs:
    * Step by step instructions for configuring a new ordao frapp (creating a new directory under fractals and creating proper frapp.json there. Do not include frapp.local.json here).
    * Step by step instructions to make the actual deployment
        * Prerequisites like privy app id and mongodb instance (recommend using mongodb atlas) and having created ordao frapp configuration (previous bullet point)
        * Mention each command to run (contracts, ornode, gui and what to do after running them)
    * Instructions / guidance for managing multiple deployments on a single server


* There should be a reader guide somewhere in the beginning that directs the reader to appropriate sections:
    * If they want ordao deployed for their community under frapps.xyz (like for other communities, e.g.: eden.frapps.xyz or zao.frapps.xyz):
        1. Either:
            * Create configuration (frapp.json) (link to instructions to do so) and create a pull request here.
            * Or fill out this form: https://docs.google.com/forms/d/e/1FAIpQLSdtVHemKjH78Z84PUZULZP3FxYRupt5YKQL5WSapb_sv8f1rQ/viewform
        2. Create a contribution request in [synchronous respect tree game](https://hackmd.io/@sim31/srt-1)  we are currently playing biweekly [here](https://t.me/edenfractal/5562). Reference your PR (if you created it).
    * If they want to deploy ORDAO themselves (self-host), direct them to the instructions to configure and make the deployment.

## Notes on style:
* Be succinct.
* Don't go into implementation details;
* Be reader-oriented (making it easy for them to use);