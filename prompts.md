
# Refactor frapps codebase
## Changes to docs
* Be less verbose, more succinct. Don't talk about implementation details, underlying tools being used. Be more oriented towards the user. Especially in the beginning. Some examples
    * line 5: no need to mention specific files here. Especially in the intro;
    * line 6: just say ORDAO module / codebase. User should not care if it's git submodule or what;
* Line 7: "Scripts for deployment and maintenance of ORDAO deployments. Command line interface implementation to run all of that."
* Extract "CLI reference" to a separate file;
* Extract "Configuration reference" to a separate file;
* In "Create a new ORDAO frapp configuration" section where you have "Minimal ORDAO example", I want it to focus not on minimality, but to showcase the most common patterns in configuration... See existing frapp configs, copy pattern from etlocal colorcolumn=0them. Also format the json cleanly (objects should start a new line);
* Fix "TODO"s I added as comments;