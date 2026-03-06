# Stage 2 workflow

Let's create a workflow to create polls for stage 2.

Now the main issue here will be how an agent should create a snapshot poll? Two sub-issues:
* Typically snapshot polls have [proposal validation strategy](https://docs.snapshot.box/snapshot-x/protocol/proposal-validations) that allows only respect holders to create proposals.
    * I could change the setting to allow authors to do that. You would have to be an author
    * You would then need a wallet...
* Will it at all be possible for you (or a script) to create a snapshot poll through snapshot API?

The other part of this is generating a markdown file for the poll description. This should be straightforward to do if user provides chat archive?

So I think it would be best to have separate workflows:
1. Snapshot proposal description generation workflow
2. Snapshot proposal creation workflow
3. Workflow that would use both of the previous workflows to do everything in one go