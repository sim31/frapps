# Ordao Console

This is documentation for [Orclient](https://github.com/sim31/frapps/tree/main/impl/orclient) - library for client-side [ORDAO](https://github.com/sim31/frapps/tree/main/impl/ordao) apps / frontends, that abstracts all the communication with the backend and blockchain.

This page also exposes orclient interface through developer console. On this page pres `CTRL+SHIFT+I` to open developer tools where you should be able to access developer console. You should see something like this:
![dev-console](./img/dev-console-open.png)

Now write in console `c.help()` and press enter. You should see some help text printed back in console. You should also be navigated back to this page, if you navigated somewhere else earlier. **Use `c.help()` command to get back to this page.**

`c.help()` should have printed a list of methods exposed by orclient. To see a documentation with examples for a particular method use `c.<method>.help()` command where `<method>` is the name of one of the methods. For example enter: `c.proposeBreakoutResult.help()`. This will make you jump to section about this method in the documentation. There you should find an example usage of `proposeBreakoutResult` method. Try it. If you are logged in with metamask to the right network and with account that has Respect, it should work. After waiting up to a minute you should see an object in console that contains information about executed transaction:
![proposeBreakoutResponse](./img/dev-console-propose-return.png).


