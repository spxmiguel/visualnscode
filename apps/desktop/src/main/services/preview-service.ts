import { createServer, type Server, type ServerResponse } from 'node:http';
import { Readable } from 'node:stream';

const BRIDGE = String.raw`<script data-visualnscode-preview>
(()=>{const send=(type,payload)=>parent.postMessage({source:'visualnscode-preview',type,payload},'*');
const printable=v=>{if(typeof v==='string')return v;try{return JSON.stringify(v)}catch{return String(v)}};for(const level of ['log','info','warn','error']){const original=console[level];console[level]=(...args)=>{send('console',{level,message:args.map(printable).join(' '),timestamp:new Date().toISOString()});original.apply(console,args)}}
const originalFetch=window.fetch;window.fetch=async(...args)=>{const started=performance.now(),method=args[1]?.method||'GET',url=String(args[0]?.url||args[0]);try{const response=await originalFetch(...args);send('network',{level:response.ok?'info':'error',message:method+' '+url+' — '+response.status+' ('+Math.round(performance.now()-started)+'ms)',timestamp:new Date().toISOString()});return response}catch(error){send('network',{level:'error',message:method+' '+url+' — '+String(error),timestamp:new Date().toISOString()});throw error}};
let selecting=false,last=null;const selector=(el)=>{if(el.id)return '#'+CSS.escape(el.id);const parts=[];for(let node=el;node&&node.nodeType===1&&parts.length<6;node=node.parentElement){let part=node.tagName.toLowerCase();const classes=[...node.classList].slice(0,2);if(classes.length)part+='.'+classes.map(v=>CSS.escape(v)).join('.');if(node.parentElement){const same=[...node.parentElement.children].filter(v=>v.tagName===node.tagName);if(same.length>1)part+=':nth-of-type('+(same.indexOf(node)+1)+')'}parts.unshift(part)}return parts.join(' > ')};
const clear=()=>{if(last){last.style.outline=last.dataset.vnsOutline||'';delete last.dataset.vnsOutline;last=null}};
addEventListener('mousemove',event=>{if(!selecting)return;clear();last=event.target;if(last instanceof HTMLElement){last.dataset.vnsOutline=last.style.outline;last.style.outline='2px solid #7c5cff'}},true);
addEventListener('click',event=>{if(!selecting)return;event.preventDefault();event.stopPropagation();const el=event.target;if(!(el instanceof HTMLElement))return;const rect=el.getBoundingClientRect(),attributes={};for(const attr of [...el.attributes])if((['id','class','role','name','type','title'].includes(attr.name)||attr.name.startsWith('aria-')||attr.name==='data-testid')&&attr.value.length<300)attributes[attr.name]=attr.value;send('element',{selector:selector(el),tag:el.tagName.toLowerCase(),id:el.id||null,classes:[...el.classList],text:(el.innerText||el.textContent||'').trim().slice(0,500),attributes,bounds:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},url:location.href});selecting=false;clear()},true);
addEventListener('message',event=>{if(event.data?.source!=='visualnscode-host')return;if(event.data.type==='select')selecting=Boolean(event.data.enabled)});
send('ready',{});})();
</script>`;

const isLocalUrl = (input: string): URL => {
  const url = new URL(input);
  const local = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  if (!local || !['http:', 'https:'].includes(url.protocol)) {
    throw new Error('O preview aceita apenas servidores locais.');
  }
  return url;
};

export class PreviewService {
  private server: Server | null = null;
  private source: URL | null = null;
  private proxyUrl: string | null = null;

  async connect(target: string): Promise<string> {
    const source = isLocalUrl(target);
    if (this.server && this.source?.origin === source.origin && this.proxyUrl) return this.proxyUrl;
    await this.stop();
    this.source = source;
    this.server = createServer((request, response) => {
      void this.forward(request.url ?? '/', request.method ?? 'GET', request.headers, response);
    });
    await new Promise<void>((resolve, reject) => {
      this.server!.once('error', reject);
      this.server!.listen(0, '127.0.0.1', () => resolve());
    });
    const address = this.server.address();
    if (!address || typeof address === 'string')
      throw new Error('Não foi possível abrir o preview.');
    this.proxyUrl = `http://127.0.0.1:${address.port}${source.pathname}${source.search}`;
    return this.proxyUrl;
  }

  async stop(): Promise<void> {
    if (!this.server) return;
    const current = this.server;
    this.server = null;
    this.source = null;
    this.proxyUrl = null;
    await new Promise<void>((resolve) => current.close(() => resolve()));
  }

  private async forward(
    requestPath: string,
    method: string,
    headers: Readonly<Record<string, string | string[] | undefined>>,
    response: ServerResponse,
  ): Promise<void> {
    try {
      if (!this.source) throw new Error('Preview desconectado.');
      const incoming = new URL(requestPath, 'http://preview.local');
      const target = new URL(`${incoming.pathname}${incoming.search}`, this.source.origin);
      const upstream = await fetch(target, {
        method: ['GET', 'HEAD'].includes(method) ? method : 'GET',
        headers: {
          accept: Array.isArray(headers.accept)
            ? headers.accept.join(',')
            : (headers.accept ?? '*/*'),
          'user-agent': 'VisualnsCode Preview',
        },
        redirect: 'manual',
      });
      const responseHeaders = Object.fromEntries(upstream.headers.entries());
      delete responseHeaders['content-security-policy'];
      delete responseHeaders['content-length'];
      delete responseHeaders['set-cookie'];
      if (responseHeaders.location) {
        const location = new URL(responseHeaders.location, target);
        responseHeaders.location = `${location.pathname}${location.search}`;
      }
      const contentType = upstream.headers.get('content-type') ?? '';
      const lastSegment = target.pathname.split('/').at(-1) ?? '';
      if (/text\/html/iu.test(contentType) || !lastSegment.includes('.')) {
        delete responseHeaders['content-encoding'];
        response.writeHead(upstream.status, responseHeaders);
        const html = await upstream.text();
        response.end(
          html.includes('</head>')
            ? html.replace('</head>', `${BRIDGE}</head>`)
            : `${BRIDGE}${html}`,
        );
      } else {
        response.writeHead(upstream.status, responseHeaders);
        if (upstream.body) Readable.fromWeb(upstream.body as never).pipe(response);
        else response.end();
      }
    } catch (error) {
      response.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
      response.end(error instanceof Error ? error.message : 'Preview indisponível.');
    }
  }
}

export { isLocalUrl };
