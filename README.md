# DenoServer
## Usage
```ts
import { TinyServer } from "https://raw.githubusercontent.com/CedricMeu/TinyServer/master/mod.ts"

let server = new TinyServer({
    hostname: "localhost",
    port: 3000,
    certFile: "server.cert",    // Automatically switches from http to https
    keyFile: "server.key"       // if server.cert and server.key are provided.
})
.get("/", (req, res) => {        // Adding routes can be chained
    req.file("index.html");
})
.get("/api/v1/{username}", (req, res) => {
    req.json({ test: req.params.username });    // parameters can be accessed as such
});
.get("/api/v2/{username}", (req, res) => {        
    req.json({ test: req.param("username") });    // or like this
});

console.log(`listening on ${server.protocol}://${server.hostname}:${server.port}`);
```
