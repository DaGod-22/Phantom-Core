"use client";

import { FormEvent, useState } from "react";

function normalize(value:string){const v=value.trim(); if(!v)return "https://example.com"; if(/^[a-z][a-z0-9+.-]*:\/\//i.test(v))return v; if(v.includes("."))return `https://${v}`; return `https://www.google.com/search?q=${encodeURIComponent(v)}`}

export default function ProxyPage(){
 const [url,setUrl]=useState("https://example.com"); const [src,setSrc]=useState(""); const [error,setError]=useState("");
 const go=(e?:FormEvent)=>{e?.preventDefault();setError("");setSrc(`/api/proxy?url=${encodeURIComponent(normalize(url))}`)};
 return <main className="proxyPage"><div className="proxyBar"><a className="brand" href="/">GG<span>•</span>LOUNGE</a><form onSubmit={go}><input value={url} onChange={e=>setUrl(e.target.value)} aria-label="Website URL"/><button className="primary" type="submit">Go</button></form><button className="secondary" onClick={()=>{setSrc("");setError("")}}>Clear</button></div><div className="proxyNotice"><b>PHANTOM WEB · VERCEL GATEWAY</b><span>Public HTTP(S) fetch + HTML rewriting. Private-network targets are blocked. Complex sites that require their own backend/WebSockets may still need the dedicated Phantom transport service.</span></div>{error&&<div className="notice">{error}</div>}{src?<iframe className="proxyFrame" src={src} title="Phantom Web" sandbox="allow-forms allow-modals allow-popups allow-scripts allow-same-origin" onLoad={()=>setError("")} />:<div className="proxyEmpty"><div className="eyebrow">PHANTOM CORE</div><h1>Browse through the gateway.</h1><p>Enter a public website above. The gateway runs on the same Next.js deployment, so this page no longer depends on a separate proxy server merely to open.</p><button className="primary" onClick={()=>go()}>Open example.com</button></div>}</main>
}
