import http from 'node:http';
import net from 'node:net';

// WebKit Playwright's offline emulator rejects cached SW navigations (#42775).
// A real, isolated origin outage exercises the same assertions without retries,
// disabling SW, or changing application behavior. Never proxies production.
export async function realOutageProxy(upstream='http://127.0.0.1:4173'){
 const target=new URL(upstream);if(target.hostname!=='127.0.0.1'||target.port!=='4173')throw Error('SYNTHETIC_LOCAL_ORIGIN_REQUIRED');
 const sockets=new Set(),upgrades=new Set();let port,started=false;
 const server=http.createServer(async(req,res)=>{
   try{
     const chunks=[];for await(const chunk of req)chunks.push(chunk);
     const headers={...req.headers,host:target.host};
     if(headers.origin)headers.origin=upstream;
     if(headers.referer){const source=new URL(headers.referer);headers.referer=upstream+source.pathname+source.search;}
     delete headers.connection;delete headers['content-length'];
     const body=Buffer.concat(chunks),response=await fetch(upstream+req.url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body}:{}),redirect:'manual'});
     res.statusCode=response.status;
     for(const [name,value] of response.headers)if(!['content-encoding','content-length','transfer-encoding','connection','set-cookie'].includes(name))res.setHeader(name,value);
     const cookies=response.headers.getSetCookie();if(cookies.length)res.setHeader('set-cookie',cookies);
     res.end(Buffer.from(await response.arrayBuffer()));
   }catch{if(!res.destroyed){res.writeHead(503);res.end('Synthetic upstream unavailable');}}
 });
 server.on('connection',socket=>{sockets.add(socket);socket.once('close',()=>sockets.delete(socket));});
 server.on('upgrade',(req,socket,head)=>{
   const remote=net.connect(Number(target.port),target.hostname);upgrades.add(remote);remote.once('close',()=>upgrades.delete(remote));remote.on('error',()=>socket.destroy());socket.on('error',()=>remote.destroy());socket.once('close',()=>remote.destroy());
   remote.once('connect',()=>{const headers={...req.headers,host:target.host};if(headers.origin)headers.origin=upstream;
     remote.write('GET '+req.url+' HTTP/1.1\r\n'+Object.entries(headers).map(([name,value])=>name+': '+value).join('\r\n')+'\r\n\r\n');if(head.length)remote.write(head);remote.pipe(socket);socket.pipe(remote);
   });
 });
 const start=async()=>{if(started)return;await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port??0,'127.0.0.1',()=>{server.removeListener('error',reject);resolve();});});port=server.address().port;started=true;};
 const stop=async()=>{if(!started)return;started=false;const closed=new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));for(const socket of [...sockets,...upgrades])socket.destroy();await closed;};
 await start();return{origin:'http://127.0.0.1:'+port,start,stop};
}
