# Workflow for the report

Let's make this process reproduceable - I will want to generate a report every two weeks. I think we should create a windsurf workflow for this reason.

I also think you should make some adjustments to how you do this.

## Problem with retrieving and adding full proposal descriptions

As I understand taking descriptions from messages archive, which is in html was really problematic. What about taking proposal descriptions from snapshot poll descriptions? All polls we created, we had all proposals with their descriptions in the poll description. And I used markdown when adding those poll descriptions through snapshot interface, so maybe it would be possible for you to retrieve poll descriptions in such friendly format. I'm fine with using snapshot poll descriptions as authority regarding proposal descriptions - you don't need to check if proposal descriptions in telegram matches.

## Can you read telegram chats?

This chat in particular: https://t.me/edenfractal/5562

Would save me time exporting and saving archives here.

## Making resulting html smaller

I've seen you complain about the size of html when making edits and you had to use scripts to do them.

Probably the main cause is proposal descriptions? It would be nice to not store them in html anyway. Maybe markdown files, plus some markdown rendering component?

I'm also open losing the requirement of having it all in a single html file. It could be a directory.

