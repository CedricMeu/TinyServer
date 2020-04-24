import { ServerRequest, listenAndServeTLS, listenAndServe } from "../deps.ts";

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

    constructor(response: ServerRequest) {
        this.response = response;
    }

    text(data: string): void {
        this.response.respond({ body:data })
    }

    json(data: any): void {
        this.response.respond({ body:JSON.stringify(data) })
    }

    file(file_path: string): void {
        // TODO
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
