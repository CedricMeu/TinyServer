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

    private params: { [key: string]: any };

    constructor(request: ServerRequest) {
        this.request = request;
        this.params = {};
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
    
    public param(key: string): any {
        return this.params[key];
    }

    public putParam(key: string, value: any) {
        this.params[key] = value;
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
            throw new Error("Specified path does not direct to a file");
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

type RouteHandle = (req: TinyRequest, res: TinyResponse) => void;

class RouteEntries {
    [index: string]: Route
}; 

class Route {
    handle?: RouteHandle;
    entries: RouteEntries;

    public constructor() {
        this.handle = undefined;
        this.entries = {}
    }
}

class Router {
    [method: string]: Route;

    public constructor() {
        this["GET"] = new Route();
        this["PUT"] = new Route();
        this["POST"] = new Route();
        this["DELETE"] = new Route();
    }
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
    private router: Router;
    private options: TinyOptions;

    public constructor(options: TinyOptions) {
        this.options = options;
        this.router = new Router();

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

        let entry: Route = this.router[request.method];
        let handle: RouteHandle | undefined = this.findHandle(request.url, entry);
        if (handle === undefined) {
            // TODO: 404 page settings
            response.text(`404: Page '${request.url}' not found!`);
        } else {
            handle(request, response);
        }
    }

    private splitRoute(route: string): string[] {
        if (route.startsWith('/')) {
            route = route.slice(1);
        }
        if (route.endsWith('/')) {
            route = route.slice(0, route.length-1);
        }
        return route.split("/");
    }

    private findHandle(route: string, entry: Route): RouteHandle | undefined {
        const split_route = this.splitRoute(route);
        for (let i = 0; i < split_route.length; i++) {
            let index = split_route[i];
            entry = entry.entries[index];

            if (entry === undefined) {
                break;
            } else if (i == split_route.length-1) {
                return entry.handle;
            }
        }
        
        return undefined;
    }

    private addHandle(route: string, entry: Route, handle: RouteHandle): void {
        console.log(`adding ${route}`);
        
        const split_route = this.splitRoute(route);
        
        for (let i = 0; i < split_route.length; i++) {
            let index = split_route[i];          
            
            if (entry.entries[index] === undefined) {
                entry.entries[index] = new Route();
            }
            entry = entry.entries[index]

            if (i == split_route.length - 1) {
                if (entry.handle !== undefined) {
                    throw new Error(`A handle for the route '${route}' already exists.`);
                }
                entry.handle = handle;
                return;
            }

        }
    }

    public static(path: string): void {
        // TODO
    }

    // TODO: parameters
    public get(route: string, handle: (req: TinyRequest, res: TinyResponse) => void): TinyServer {
        this.addHandle(route, this.router.GET, handle);
        console.log(JSON.stringify(this.router));
        return this;
    }

    public post(route: string, handle: (req: TinyRequest, res: TinyResponse) => void): TinyServer {
        this.addHandle(route, this.router.POST, handle);
        return this;
    }

    public put(route: string, handle: (req: TinyRequest, res: TinyResponse) => void): TinyServer {
        this.addHandle(route, this.router.PUT, handle);
        return this;
    }

    public delete(route: string, handle: (req: TinyRequest, res: TinyResponse) => void): TinyServer {
        this.addHandle(route, this.router.DELETE, handle);
        return this;
    }
}
