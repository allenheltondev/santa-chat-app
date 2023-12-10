# Momento Document Sharing

Sometimes you need to share a file securely and only for a few minutes, you know?

That's exactly what you can do with Momento, no web servers needed! You can upload, share, and download files in a Momento cache directly from the browser.

![Architecture diagram](/public/architecture.png)

## Sharing files

Did you know Momento stores more than strings? You can store a byte array directly in a cache, which is perfect for document storage! In this application you can select a file, set the time to live, and upload it directly to Momento.

After your document is uploaded, you have the ability to either delete it or share it with your friends. Sharing the file will create a short-lived [token](https://docs.momentohq.com/develop/authentication/tokens) scoped with only read access to the one file. Users can use that token to download the item from your cache.

Tokens have a maximum expiration time of 1 hour, so share quickly!

### How a file is uploaded

When you upload a file to Momento, two things are happening:

1. A [dictionary cache item](https://docs.momentohq.com/develop/api-reference/collections/dictionary) is created to store the content and metadata of your document
    * Metadata stored:
        * **type** - File mime-type
        * **expiresAt** - ISO8601 time when the file will automatically be removed
        * **content** - Base64 encoded version of your document
2. A [set cache item](https://docs.momentohq.com/develop/api-reference/collections/sets) is updated to include the filename of your new document
    * This is used to keep track of all the files you have active in the system

When you load the main page, the list of all your active files is loaded and is iterated over to load the details and display them on screen.
