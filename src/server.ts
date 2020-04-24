import { ServerRequest, listenAndServeTLS, listenAndServe } from "../deps.ts";

const mimeTypes:{
    [ext: string]: string;
} = {
    "json": "application/json",
    "html": "text/html",
    "css": "text/css",
    "js": "text/javascript",
    "apng": "image/apng",
    "bmp": "image/bmp",
    "gif": "image/gif",
    "ico": "image/x-ico",
    "cur": "image/x-ico",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "jfif": "image/jpeg",
    "pjpeg": "image/jpeg",
    "pjp": "image/jpeg",
    "png": "image/png",
    "svg": "image/svg+xml",
    "tiff": "image/tiff",
    "tif": "image/tiff",
    "webp": "image/webp",
}

export class TinyRequest {
    private request: ServerRequest;

    constructor(request: ServerRequest) {
        this.request = request;
    }

    public get url() : string {
        return this.request.url;
    }
    
    public get headers(): Headers {
        return this.request.headers;
    }

    public get body() : Deno.Reader {
        return this.request.body
    }

    public get method(): string {
        return this.request.method;
    }
    
}

export class TinyResponse {
    private response: ServerRequest;
    private headers: Headers;

    constructor(response: ServerRequest) {
        this.response = response;
        this.headers = new Headers;
    }

    empty(status: number) {
        this.response.respond({ status });
    }

    text(data: string): void {
        this.headers.append("Content-Type", "text/plain");
        this.response.respond({
            status: 200,
            headers: this.headers,
            body: data
        });
    }

    json(data: any): void {
        this.headers.append("Content-Type", "application/json");
        this.response.respond({
            status: 200,
            headers: this.headers,
            body: JSON.stringify(data)
        });
    }

    file(file_path: string): void {
        const split_file_name = file_path.split(".");
        const ext_name = split_file_name[split_file_name.length-1];
        let contentType = mimeTypes[ext_name];
        if (contentType == undefined) {
            contentType = "text/plain"
        }
        const file_info = Deno.statSync(file_path);
        if (!file_info.isFile) {
            // TODO: Throw a not a file error
            return;
        }
        this.headers.append("Content-Type", contentType);
        const body = Deno.readFileSync(file_path);
        
        this.response.respond({
            status: 200,
            headers: this.headers,
            body
        });
    }
}

interface Routes {
    [method: string]: {
        [url: string]: (req: TinyRequest, res: TinyResponse) => void
    };
}

export interface TinyOptions {
    hostname?: string;
    port: number;
    certFile?: string;
    keyFile?: string;
}

interface TinyOptionsSecure {
    hostname?: string;
    port: number;
    certFile: string;
    keyFile: string;
}

export class TinyServer {
    private routes: Routes;
    private options: TinyOptions;

    public constructor(options: TinyOptions) {
        this.routes = { GET: {}, POST: {}, PUT: {}, DELETE: {} }
        this.options = options;

        if (this.options.hasOwnProperty("certFile") && this.options.hasOwnProperty("keyFile")) {
            listenAndServeTLS(<TinyOptionsSecure> this.options, (req: ServerRequest) => this.handleRequest(req));
        } else {
            listenAndServe(this.options, (req: ServerRequest) => this.handleRequest(req));
        }
    }

    public get port(): number {
        return this.options.port!;
    }
    
    protected handleRequest(req: ServerRequest) {
        let request = new TinyRequest(req);
        let response = new TinyResponse(req);
        if (this.routes[request.method][request.url] == undefined) {
            // TODO: 404 page settings
            response.text(`404: Page '${request.url}' not found!`);
        } else{
            this.routes[request.method][request.url](request, response);
        }
    }

    static(path: string): void {
        // TODO
    }

    // TODO: parameters
    get(route: string, handler: (req: TinyRequest, res: TinyResponse) => void): void {
        this.routes.GET[route] = handler;
    }

    post(route: string, handler: (req: TinyRequest, res: TinyResponse) => void): void {
        this.routes.POST[route] = handler;
    }

    put(route: string, handler: (req: TinyRequest, res: TinyResponse) => void): void {
        this.routes.PUT[route] = handler;
    }

    delete(route: string, handler: (req: TinyRequest, res: TinyResponse) => void): void {
        this.routes.DELETE[route] = handler;
    }
}
