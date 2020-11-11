---
slug: '/blog/ideas/ipa-web-ext-1'
date: '2020-10-10'
title: 'My idea for a simple web ext'
---

# An idea for a simple Web Ext

I have an idea about a simple web extension that would be useful to me and probably lots of others. As a language learner, or just someone who goes to Wikipedia articles a lot, I often see IPA characters (apparently they're actually called "phonemes" - more on that later). They are usually written between slashes, like these:
https://memex.social/a/0isRyKVnJBqTnFNFadfO

Some of the characters used are familiar to us English speakers. Though often their sound may not be what we expect from common usage in English. There's also a whole bunch of characters that are not part of the Latin alphabet that we're familiar with at all.

Anyway, if you tested me I wouldn't know how to pronounce many IPA characters. My knowledge is lacking. I don't have a huge reason to learn it, as the languages I am interested in learning don't really have the pronounciation ambiguities that arises from English spelling. In fact, they're all one-to-one. But curiosity compells me, and it just sounds fun.

So I thought it would be nice if I could simply click on any IPA phenomes I come across on the net and have a recording of the pronounciation played for me.

## How could this work?

Maybe the easiest way might be to write a context menu entry that you can click after you highlight some characters and it looks up the selection and autoplays whatever matches, nothing if no match.

Something a bit more complex, but more useful, might be a content script that is loaded on each web-page, parsing it to see what IPA phonemes it encounters. Changing their HTML to make them clickable to play the matching pronounciation.

IndexedDB would provide a nice way to store the recordings indexed via their phenome, or at least pointers to the stored recordings remotely or event bundled with the extension.

UI and UX would be minimal, so most effort might go into figuring out what a nicely designed architecture to solve this problem might look like.
